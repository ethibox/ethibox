import 'babel-polyfill';
import { PrismaClient } from '@prisma/client';
import { reset, addUser, addApps, addSettings, importTemplates } from './fixture';
import {
    getSettings,
    generateReleaseName,
    checkUrl,
    getIp,
    STATES,
} from '../utils';

const prisma = new PrismaClient();

beforeEach(async () => {
    await reset(prisma);

    const settings = [
        { name: 'rootDomain', value: 'localhost' },
    ];

    await addSettings(settings, prisma);
});

test('Should get settings', async () => {
    const settings = await getSettings(null, prisma);
    const rootDomain = await getSettings('rootDomain', prisma);

    expect(settings).toEqual({
        rootDomain: 'localhost',
    });

    expect(rootDomain).toEqual('localhost');
});

test('Should generate new release name', async () => {
    expect(await generateReleaseName('Wordpress', prisma)).toEqual('wordpress1');

    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    expect(await generateReleaseName('Wordpress', prisma)).toEqual('wordpress2');
});

test('Should return DNS ip', async () => {
    const ip = await getIp('localhost');
    expect(ip).toEqual('127.0.0.1');

    const ip2 = await getIp('unknowdomain.com');
    expect(ip2).toEqual(false);
});

test('Should check good url status', async () => {
    const url = 'https://ethibox.fr';

    const isOnline = await checkUrl(url);

    expect(isOnline).toEqual(true);
});

test('Should check bad url status', async () => {
    const url = 'https://bad.ethibox.fr';

    const isOnline = await checkUrl(url);

    expect(isOnline).toEqual(false);
});
