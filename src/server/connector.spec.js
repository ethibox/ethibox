import bcrypt from 'bcrypt';
import fetchMock from 'fetch-mock';
import { synchronizeEthibox, checkOrchestratorConnection } from './connector';
import { User, Settings, Application, Package } from './models';
import { reset, STATES } from './utils';

beforeAll(async () => {
    await reset();
});

beforeEach(async () => {
    await reset();
});

test('Check orchestrator connection', async () => {
    const orchestratorEndpoint = 'https://192.168.99.100:8443';
    const orchestratorToken = 'mytoken';

    await fetchMock.mock(`${orchestratorEndpoint}/healthz`, 'ok');
    const isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
    fetchMock.restore();

    expect(isOrchestratorOnline).toBe(true);

    expect(await checkOrchestratorConnection()).toBe(false);
});

test('Track "orchestrator uninstall application" action', async () => {
    const orchestratorApps = [{
        name: 'wordpress',
        releaseName: 'myapp',
        port: 30346,
        domainName: null,
        userId: 1,
    }, {
        name: 'wordpress',
        releaseName: 'myapp2',
        port: 30347,
        domainName: null,
        userId: 1,
    }];
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const user = await User.create({ ip: '127.0.0.1', email: 'contact@ethibox.fr', password: bcrypt.hashSync('myp@assw0rd', 10), isAdmin: false });
    const applications = [
        { releaseName: 'myapp', state: STATES.RUNNING, port: 30346, package: pkg },
        { releaseName: 'myapp2', state: STATES.RUNNING, port: 30347, package: pkg },
        { releaseName: 'myapp3', state: STATES.RUNNING, port: 30348, package: pkg },
    ];
    await Promise.all(applications.map((a) => {
        const application = Application.build(a);
        application.setPackage(pkg, { save: false });
        application.setUser(user, { save: false });
        application.save();
        return application;
    }));

    const orchestratorIp = '127.0.0.1';
    const settings = { name: 'orchestratorIp', value: orchestratorIp };
    await Settings.create(settings);

    await synchronizeEthibox(orchestratorApps);

    const newApplications = await Application.findAll({ raw: true });
    expect(newApplications).toHaveLength(2);
});

afterAll(async () => {
    await reset();
});
