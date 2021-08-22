import 'babel-polyfill';
import fetchMock from 'fetch-mock-jest';
import { PrismaClient } from '@prisma/client';
import { checkAppsStatus } from '../cron';
import { reset, addUser, addApps, addSettings, importTemplates } from './fixture';
import { STATES } from '../utils';

const MAX_TASK_TIME = process.env.MAX_TASK_TIME || 15;

const prisma = new PrismaClient();

beforeEach(async () => {
    await reset(prisma);
    fetchMock.mockReset();
});

test('Should set standby state if DNS record is not correct', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE, domain: 'bad.ethibox.fr' }], prisma);

    await checkAppsStatus(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.STANDBY);
});

test('Should set standby state if app has a certificate error', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE, domain: 'error.ethibox.fr' }], prisma);
    await addSettings([{ name: 'rootDomain', value: 'ethibox.fr' }], prisma);

    await checkAppsStatus(prisma);

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.STANDBY);
});

test('Should set standby state if an application return bad status code', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    fetchMock.get('http://wordpress1.localhost', 404);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.STANDBY);
});

test('Should set online state if an application running again', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    fetchMock.get('http://wordpress1.localhost', 504);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    fetchMock.get('http://wordpress1.localhost', 200);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.ONLINE);
});

test('Should not change state if application is deleted', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.DELETED }], prisma);

    fetchMock.get('http://wordpress1.localhost', 200);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.DELETED);
});

test('Should set offline state if an application is standby since more than 15 minutes', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    const lastTaskDate = new Date(new Date().setMinutes(new Date().getMinutes() - MAX_TASK_TIME));
    await addApps([{ templateId: 1, userId: user.id, state: STATES.STANDBY, lastTaskDate }], prisma);

    fetchMock.get('http://wordpress1.localhost', 504);
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].state).toEqual(STATES.OFFLINE);
});

test('Should set response time', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE, domain: 'localhost' }], prisma);

    fetchMock.get('http://localhost', 200, { delay: 1000 });
    await checkAppsStatus(prisma);
    fetchMock.restore();

    const applications = await prisma.application.findMany();

    expect(applications[0].responseTime).toBeGreaterThanOrEqual(1000);
});
