import 'babel-polyfill';
import { PrismaClient } from '@prisma/client';
import { reset, addUser, addApps, addSettings, importTemplates } from './fixture';
import {
    getSettings,
    generateReleaseName,
    getIp,
    STATES,
} from '../utils';

const prisma = new PrismaClient();

beforeEach(async () => {
    await reset(prisma);

    const settings = [
        { name: 'rootDomain', value: 'local.ethibox.fr' },
        { name: 'checkDomain', value: 'false' },
        { name: 'appsUserLimit', value: '10' },
    ];

    await addSettings(settings, prisma);
});

test('Should get settings', async () => {
    const settings = await getSettings(null, prisma);
    const rootDomain = await getSettings('rootDomain', prisma);
    const { checkDomain } = settings;

    expect(settings).toEqual({
        rootDomain: 'local.ethibox.fr',
        checkDomain: false,
        appsUserLimit: 10,
    });

    expect(rootDomain).toEqual('local.ethibox.fr');
    expect(checkDomain).toEqual(false);
});

test('Should generate new release name', async () => {
    expect(await generateReleaseName('Wordpress', prisma)).toEqual('wordpress1');

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@ethibox.fr', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.RUNNING }], prisma);

    expect(await generateReleaseName('Wordpress', prisma)).toEqual('wordpress2');
});

test('Should return DNS ip', async () => {
    const ip = await getIp('local.ethibox.fr');
    expect(ip).toEqual('127.0.0.1');

    const ip2 = await getIp('unknowdomain.com');
    expect(ip2).toEqual(false);
});
