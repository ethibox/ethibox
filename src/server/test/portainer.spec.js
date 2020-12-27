import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import fetchMock from 'fetch-mock-jest';
import { PrismaClient } from '@prisma/client';
import { reset } from './fixture';
import {
    auth,
    getEndpointId,
    getNodeSwarmId,
    fetchStacks,
    installApplication,
    uninstallApplication,
    getPortainerConfig,
} from '../portainer';

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
    swarmConfig: {
        CreatedAt: '2020-01-20T10:07:24.132063071Z',
        DataPathPort: 4789,
        DefaultAddrPool: ['10.0.0.0/8'],
        ID: 'b4f7t79h640tnrdcgu36q373p',
    },
    application: {
        Id: 26,
        Name: 'wordpress1',
        Type: 1,
        EndpointId: 1,
        SwarmId: 'b4f7t79h640tnrdcgu36q373p',
        EntryPoint: 'wordpress.yml',
        Env: [{ name: 'DOMAIN', value: 'mydomain.fr' }],
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
    fetchMock.get(`${mock.endpoint}/api/endpoints/${mock.endpointId}/docker/swarm`, mock.swarmConfig);
    fetchMock.get(`${mock.endpoint}/api/endpoints`, mock.endpoints);
    fetchMock.get(`${mock.endpoint}/api/stacks?method=repository&type=1&endpointId=${mock.endpointId}`, mock.stacks);
    fetchMock.post(`${mock.endpoint}/api/stacks?method=repository&type=1&endpointId=${mock.endpointId}`, mock.application);
    fetchMock.delete(`${mock.endpoint}/api/stacks/${mock.application.Id}`, mock.stacks);
});

test('Should auth', async () => {
    const jwt = await auth(mock.endpoint, mock.username, mock.password);
    expect(jwt).toBe(mock.token);
});

test('Should return first endpoint id', async () => {
    const endpointId = await getEndpointId();
    expect(endpointId).toEqual(1);
});

test('Should return sawrm ID', async () => {
    const SwarmId = await getNodeSwarmId(mock.endpointId);
    expect(SwarmId).toEqual(mock.swarmConfig.ID);
});

test('Should fetch stacks', async () => {
    const stacks = await fetchStacks();
    expect(stacks).toEqual(mock.stacks);
});

test('Should install application', async () => {
    const domain = 'mydomain.fr';
    const releaseName = 'wordpress1';
    const repositoryUrl = 'https://github.com/ethibox/stacks';
    const stackFile = 'wordpress.yml';

    const application = await installApplication(releaseName, domain, repositoryUrl, stackFile);
    expect(application).toEqual(mock.application);
});

test('Should uninstall application', async () => {
    const releaseName = 'wordpress1';
    await uninstallApplication(releaseName);
});

test('Should generate new token if not exist', async () => {
    const tokenPath = path.join(__dirname, '../../../.token');
    fs.writeFileSync(tokenPath, '');
    expect(fs.readFileSync(tokenPath, 'utf8')).toEqual('');
    const { token } = await getPortainerConfig();
    expect(token).toEqual(mock.token);
    expect(fs.readFileSync(tokenPath, 'utf8')).toEqual(mock.token);
});

test.skip('Should not auth if bad logins', async () => {
    expect(await auth(mock.endpoint, mock.username, mock.password)).rejects.toThrow('Application already exist');
});

test.skip('Should not install application with existing name', async () => {
    const domain = 'mydomain.fr';
    const releaseName = 'wordpress1';
    const stackName = 'Wordpress';

    await expect(installApplication(stackName, releaseName, domain)).rejects.toThrow('Application already exist');
});
