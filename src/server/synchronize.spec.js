import fetchMock from 'fetch-mock';
import { trackCompletedActions } from './synchronize';
import { Application, Settings, Package } from './models';
import { reset, STATES } from './utils';

beforeAll(async () => {
    await reset();
});

beforeEach(async () => {
    await reset();
});

test('Track "install application" action', async () => {
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const application = Application.build({ releaseName: 'myapp', state: STATES.INSTALLING, port: 30346, package: pkg });
    application.setPackage(pkg, { save: false });
    application.save();
    const orchestratorIp = '192.168.99.100';
    const settings = { name: 'orchestratorIp', value: orchestratorIp };
    await Settings.create(settings);

    fetchMock.get(`http://${orchestratorIp}:${application.port}`, 'ok');
    await trackCompletedActions(orchestratorIp);
    fetchMock.restore();

    const newApplication = await Application.findOne({ where: { id: 1 } });
    expect(newApplication.state).toBe(STATES.RUNNING);
});

test('Track "add domain" action with checkDnsEnabled', async () => {
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const application = Application.build({ releaseName: 'myapp', domainName: 'test.fr', state: STATES.EDITING, port: 30346, package: pkg });
    application.setPackage(pkg, { save: false });
    application.save();
    const orchestratorIp = '127.0.0.1';
    await Settings.create({ name: 'orchestratorIp', value: orchestratorIp });
    await Settings.create({ name: 'checkDnsEnabled', value: true });

    await trackCompletedActions(orchestratorIp);

    const newApplication = await Application.findOne({ where: { id: 1 } });
    expect(newApplication.state).toBe(STATES.RUNNING);
});

test('Track "add domain" action without checkDnsEnabled', async () => {
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const application = Application.build({ releaseName: 'myapp', domainName: 'test.fr', state: STATES.EDITING, port: 30346, package: pkg });
    application.setPackage(pkg, { save: false });
    application.save();
    const orchestratorIp = '127.0.0.1';
    await Settings.create({ name: 'orchestratorIp', value: orchestratorIp });
    await Settings.create({ name: 'checkDnsEnabled', value: false });

    fetchMock.get(`http://${orchestratorIp}:${application.port}`, 'ok');
    await trackCompletedActions(orchestratorIp);
    fetchMock.restore();

    const newApplication = await Application.findOne({ where: { id: 1 } });
    expect(newApplication.state).toBe(STATES.RUNNING);
});

test('Track "remove domain" action', async () => {
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const application = Application.build({ releaseName: 'myapp', state: STATES.EDITING, port: 30346, package: pkg });
    application.setPackage(pkg, { save: false });
    application.save();
    const orchestratorIp = '127.0.0.1';
    const settings = { name: 'orchestratorIp', value: orchestratorIp };
    await Settings.create(settings);

    fetchMock.get(`http://${orchestratorIp}:${application.port}`, 'ok');
    await trackCompletedActions(orchestratorIp);
    fetchMock.restore();

    const newApplication = await Application.findOne({ where: { id: 1 } });
    expect(newApplication.state).toBe(STATES.RUNNING);
});

afterAll(async () => {
    await reset();
});
