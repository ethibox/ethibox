import { jest } from '@jest/globals';
import { TEST_EMAIL, TEST_PASSWORD } from '../../lib/constants';

jest.unstable_mockModule('../../lib/docker', () => ({
    init: jest.fn().mockResolvedValue(true),
    deploy: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true),
}));

const { Env, User, App, sequelize } = await import('../../lib/orm');
const { default: handler } = await import('../../pages/api/apps');

beforeAll(async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await sequelize.sync({ force: true });
});

test('Should send webhook with CUSTOM_ENV_ALL env when installing a new app', async () => {
    process.env.CUSTOM_ENV_ALL_VOLUME_PATH = '/mnt/data/';
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });

    await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });

    const req = { method: 'POST', headers: { 'x-user-email': TEST_EMAIL }, body: { name: 'Nextcloud' } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const envs = JSON.parse(body.data.envs);
    expect(envs).toEqual(expect.arrayContaining([{ name: 'VOLUME_PATH', value: '/mnt/data/' }]));
}, 20000);

test('Should send webhook with CUSTOM_ENV_MYAPP_ env when updating a new app', async () => {
    process.env.CUSTOM_ENV_NEXTCLOUD_OBJECTSTORE_S3_HOST = 's3.example.com';
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });

    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    await App.create({ releaseName: 'nextcloud2', domain: 'nextcloud2.localhost', userId: user.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: { releaseName: 'nextcloud2', domain: 'nextcloud2.localhost', envs: [] },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const envs = JSON.parse(body.data.envs);
    expect(envs).toEqual(expect.arrayContaining([{ name: 'OBJECTSTORE_S3_HOST', value: 's3.example.com' }]));
}, 20000);

test('Should update envs when updating an application', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    const app = await App.create({ releaseName: 'nextcloud3', domain: 'nextcloud3.localhost', userId: user.id });
    await Env.create({ name: 'FORCE_LANGUAGE', value: 'fr', appId: app.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: {
            releaseName: 'nextcloud3',
            domain: 'nextcloud3.localhost',
            envs: [{ name: 'FORCE_LANGUAGE', value: 'en' }],
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const env = await Env.findOne({ where: { name: 'FORCE_LANGUAGE', appId: app.id } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(env?.value).toBe('en');
});

test('Should not return preset envs on GET request', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    const app = await App.create({ releaseName: 'nextcloud4', domain: 'nextcloud4.localhost', userId: user.id });

    await Env.create({ name: 'OBJECTSTORE_S3_HOST', value: 's3.example.com', appId: app.id });
    await Env.create({ name: 'FORCE_LANGUAGE', value: 'fr', appId: app.id });

    const req = { method: 'GET', headers: { 'x-user-email': TEST_EMAIL } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const { envs } = res.json.mock.calls[0][0].apps[0];

    expect(envs).toHaveLength(1);
    expect(envs[0].name).toBe('FORCE_LANGUAGE');
    expect(envs.find((env) => env.name === 'OBJECTSTORE_S3_HOST')).toBeUndefined();
});

test('Should only return envs defined in templates.json, no extra envs', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    const app = await App.create({ releaseName: 'nextcloud5', domain: 'nextcloud5.localhost', userId: user.id });
    await Env.create({ name: 'FORCE_LANGUAGE', value: 'fr', appId: app.id });
    await Env.create({ name: 'CUSTOM_EXTRA_ENV', value: 'should_not_appear', appId: app.id });

    const req = { method: 'GET', headers: { 'x-user-email': TEST_EMAIL } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const envs = res.json.mock.calls[0][0].apps.find((a) => a.releaseName === 'nextcloud5')?.envs || [];

    expect(envs[0].name).toBe('FORCE_LANGUAGE');
    expect(envs.find((env) => env.name === 'CUSTOM_EXTRA_ENV')).toBeUndefined();
});

test('Should return the correct env value and options for select type', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    const app = await App.create({ releaseName: 'nextcloud6', domain: 'nextcloud6.localhost', userId: user.id });
    await Env.create({ name: 'FORCE_LANGUAGE', value: 'en', appId: app.id });

    const req = { method: 'GET', headers: { 'x-user-email': TEST_EMAIL } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const envs = res.json.mock.calls[0][0].apps.find((a) => a.releaseName === 'nextcloud6')?.envs || [];
    expect(envs).toHaveLength(1);
    expect(envs[0].name).toBe('FORCE_LANGUAGE');
    expect(envs[0].value).toBe('en');
    expect(envs[0].type).toBe('select');
    expect(envs[0].select[0]).toEqual({ name: 'Fr', value: 'fr' });
    expect(envs[0].select[1]).toEqual({ name: 'En', value: 'en' });
});

test('Should fill ADMIN_EMAIL with user email and ADMIN_PASSWORD with generated password', async () => {
    await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });

    const req = { method: 'POST', headers: { 'x-user-email': TEST_EMAIL }, body: { name: 'Odoo' } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const app = await App.findOne({ where: { releaseName: 'odoo1' } });
    const adminEmailEnv = await Env.findOne({ where: { name: 'ADMIN_EMAIL', appId: app.id } });
    const adminPasswordEnv = await Env.findOne({ where: { name: 'ADMIN_PASSWORD', appId: app.id } });

    expect(adminEmailEnv.value).toBe(TEST_EMAIL);
    expect(adminPasswordEnv.value).toBeTruthy();
}, 20000);

test('Should reject domain update when IP does not match root domain IP', async () => {
    process.env.ROOT_DOMAIN = 'ethibox.fr';

    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    await App.create({ releaseName: 'wordpress2', domain: 'wordpress2.ethibox.fr', userId: user.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: {
            releaseName: 'wordpress2',
            domain: 'invalid-domain-with-wrong-ip.com',
            envs: [],
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Please setup a correct DNS zone of type A for your domain invalid-domain-with-wrong-ip.com with the ip'),
    });
});

test('Should accept domain update when IP matches root domain IP', async () => {
    process.env.ROOT_DOMAIN = 'ethibox.fr';

    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    await App.create({ releaseName: 'wordpress3', domain: 'wordpress3.ethibox.fr', userId: user.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: {
            releaseName: 'wordpress3',
            domain: 'valid-subdomain.ethibox.fr',
            envs: [],
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
});

test('Should install multiple same apps', async () => {
    await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });

    const req = { method: 'POST', headers: { 'x-user-email': TEST_EMAIL }, body: { name: 'Nextcloud' } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);
    await handler(req, res);
}, 20000);

test('Should not create unexisting envs', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    await App.create({ releaseName: 'kanboard1', domain: 'kanboard1.localhost', userId: user.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: {
            releaseName: 'kanboard1',
            domain: 'kanboard1.localhost',
            envs: [{ name: 'UNEXISTING', value: 'unexisting' }],
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const env = await Env.findOne({ where: { name: 'UNEXISTING' } });
    expect(env).toBeNull();
}, 20000);

test('Should not update disabled envs', async () => {
    const [user] = await User.findOrCreate({ where: { email: TEST_EMAIL }, defaults: { password: TEST_PASSWORD } });
    await App.create({ releaseName: 'kanboard2', domain: 'kanboard2.localhost', userId: user.id });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': TEST_EMAIL },
        body: {
            releaseName: 'kanboard2',
            domain: 'kanboard2.localhost',
            envs: [{ name: 'INITIAL_ADMIN_PASSWORD', value: 'newpassword' }],
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    const env = await Env.findOne({ where: { value: 'newpassword' } });
    expect(env).toBeNull();
}, 20000);
