import bcrypt from 'bcrypt';
import { applicationsQuery, userQuery } from './resolvers';
import { User, Settings, Application, Package } from './models';
import { reset, STATES } from './utils';

beforeAll(async () => {
    await reset();
});

beforeEach(async () => {
    await reset();
});

test('Get user applications', async () => {
    const user = await User.create({ ip: '127.0.0.1', email: 'contact@ethibox.fr', password: bcrypt.hashSync('myp@assw0rd', 10), isAdmin: false });
    const pkg = await Package.create({ name: 'wordpress', category: 'blog' });
    const application = await Application.build({ releaseName: 'myapp', domainName: 'test.fr', state: STATES.EDITING, port: 30346, user, package: pkg });
    await application.setUser(user, { save: false });
    await application.setPackage(pkg, { save: false });
    await application.save();
    const settings = { orchestratorIp: '192.168.99.100' };
    await Settings.create(settings);
    const context = { req: { user: { id: 1 }, settings } };

    const applications = await applicationsQuery(null, null, context);

    expect(applications[0].releaseName).toBe('myapp');
});

test('Get user data', async () => {
    const context = { req: {
        user: await User.create({ ip: '127.0.0.1', email: 'contact@ethibox.fr', password: bcrypt.hashSync('myp@assw0rd', 10), isAdmin: false }),
    } };

    const user = await userQuery(null, null, context);

    expect(user.email).toBe('contact@ethibox.fr');
});

afterAll(async () => {
    await reset();
});
