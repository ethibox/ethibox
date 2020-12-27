import 'babel-polyfill';
import fetchMock from 'fetch-mock-jest';
import { PrismaClient } from '@prisma/client';
import { installApplications, uninstallApplications, checkAppsStatus } from '../cron';
import { reset, addUser, addApps, addSettings, addWebhooks, importTemplates } from './fixture';
import { TASKS, STATES } from '../utils';

const mock = {
    endpointId: 1,
    username: 'admin',
    password: 'myp@ssw0rd',
    endpoint: 'http://portainer.localhost',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOjEsImV4cCI6MTU4NzY3ODAwM30.VZfC0BHaw9tfrxVIcFkreba6DfQlwIemJYGXjUC-0Ag',
    endpoints: [
        {
            Id: 1,
            Name: 'primary',
            Type: 2,
            URL: 'tcp://tasks.agent:9001',
        },
    ],
    application: {
        Id: 26,
        Name: 'wordpress1',
        Type: 1,
        EndpointId: 1,
        SwarmId: 'b4f7t79h640tnrdcgu36q373p',
        EntryPoint: 'wordpress.yml',
        Env: [{ name: 'DOMAIN', value: 'mydomain.fr' }],
    },
    swarmConfig: {
        CreatedAt: '2020-01-20T10:07:24.132063071Z',
        DataPathPort: 4789,
        DefaultAddrPool: ['10.0.0.0/8'],
        ID: 'b4f7t79h640tnrdcgu36q373p',
    },
    stacks: [{
        Id: 26,
        Name: 'wordpress1',
        Type: 1,
        EndpointId: 1,
        SwarmId: 'b4f7t79h640tnrdcgu36q373p',
        EntryPoint: 'wordpress.yml',
        Env: [{ name: 'DOMAIN', value: 'mydomain.fr' }],
    }],
};

const prisma = new PrismaClient();

beforeEach(async () => {
    await reset(prisma);
    fetchMock.mockReset();
    fetchMock.post(`${mock.endpoint}/api/auth`, { jwt: mock.token });
    fetchMock.get(`${mock.endpoint}/api/endpoints`, mock.endpoints);
    fetchMock.get(`${mock.endpoint}/api/endpoints/${mock.endpointId}/docker/swarm`, mock.swarmConfig);
    fetchMock.post(`${mock.endpoint}/api/stacks?method=repository&type=1&endpointId=${mock.endpointId}`, mock.application);
    fetchMock.get(`${mock.endpoint}/api/stacks?method=repository&type=1&endpointId=${mock.endpointId}`, mock.stacks);
    fetchMock.delete(`${mock.endpoint}/api/stacks/${mock.application.Id}`, mock.stacks);
    fetchMock.post('http://webhook.url/endpoint', true);
});

test('Should install applications on portainer', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id }], prisma);

    await installApplications(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].task).toEqual(null);
});

test('Should uninstall applications on portainer', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, task: TASKS.UNINSTALL }], prisma);

    await uninstallApplications(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.DELETED);
    expect(applications[0].error).toEqual(null);
    expect(applications[0].task).toEqual(null);
});

test('Should set error if a running application return bad status code', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.RUNNING }], prisma);

    fetchMock.get('http://wordpress1.local.ethibox.fr', 504);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].error).toEqual('Status code error');
});

test('Should set error if DNS record is not correct', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.RUNNING, domain: 'bad.ethibox.fr' }], prisma);

    await checkAppsStatus(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].error).toEqual('DNS Error');
});

test('Should set error if application task stuck after 15 minutes', async () => {
    const lastTaskDate = new Date(Date.now() - 1000 * 60 * 16);

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.INSTALLING, lastTaskDate }], prisma);

    fetchMock.get('http://wordpress1.local.ethibox.fr', 404);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].error).toEqual('Application stuck');
});

test('Should bypass error if a task is in progress', async () => {
    const lastTaskDate = new Date(Date.now() - 1000 * 60 * 14);

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.INSTALLING, lastTaskDate }], prisma);

    fetchMock.get('http://wordpress1.local.ethibox.fr', 404);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.INSTALLING);
    expect(applications[0].error).toEqual(null);
});

test('Should set state as running when installation is finished', async () => {
    const lastTaskDate = new Date(Date.now() - 1000 * 60 * 8);

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.INSTALLING, lastTaskDate }], prisma);

    fetchMock.get('http://wordpress1.local.ethibox.fr', 200);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.RUNNING);
    expect(applications[0].error).toEqual(null);
});

test('Should remove error if app running again', async () => {
    const lastTaskDate = new Date(Date.now() - 1000 * 60 * 16);

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.INSTALLING, lastTaskDate }], prisma);

    fetchMock.get('http://wordpress1.local.ethibox.fr', 504);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    fetchMock.get('http://wordpress1.local.ethibox.fr', 200);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].error).toEqual(null);
});

test('Should set error if app has a certificate error', async () => {
    fetchMock.mockReset();

    const lastTaskDate = new Date(Date.now() - 1000 * 60 * 14);

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.RUNNING, lastTaskDate, domain: 'error.ethibox.fr' }], prisma);
    await addSettings([{ name: 'rootDomain', value: 'ethibox.fr' }], prisma);

    await checkAppsStatus(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].error).toEqual('Certificate error');
});

test('Should not change state for uninstalling apps', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.UNINSTALLING }], prisma);

    await checkAppsStatus(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.UNINSTALLING);
});

test('Should send install webhook', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, task: TASKS.INSTALL }], prisma);
    await addWebhooks([{ event: 'install', targetUrl: 'http://webhook.url/endpoint' }], prisma);

    await installApplications(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].task).toEqual(null);
});

test('Should set response time', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.RUNNING, domain: 'local.ethibox.fr' }], prisma);

    fetchMock.get('http://local.ethibox.fr', 200, { delay: 1000 });
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].responseTime).toBeGreaterThan(1000);
});

test.skip('Should set error if a running application return bad status code for 5 minutes', async () => {
    expect(true).toEqual(false);
});
