import 'babel-polyfill';
import 'dotenv/config';
import 'isomorphic-fetch';
import { PrismaClient } from '@prisma/client';
import { reset, addUser, addApps, addSettings, importTemplates } from './fixture';
import { STATES } from '../utils';
import {
    registerMutation,
    installApplicationMutation,
    uninstallApplicationMutation,
    updateSettingsMutation,
    applicationEnvsQuery,
    invoicesQuery,
    deleteAccountMutation,
    updateUserMutation,
    updateAppMutation,
} from '../resolvers';

const prisma = new PrismaClient();

test('Should register admin user', async () => {
    await reset(prisma);

    const email = 'admin@example.com';
    const password = 'myp@ssw0rd';

    const { user } = await registerMutation(null, { email, password }, { prisma });

    expect(user.email).toEqual(email);
    expect(user.isAdmin).toEqual(true);
});

test('Should register user', async () => {
    const email = 'user@example.com';
    const password = 'myp@ssw0rd';

    const { user } = await registerMutation(null, { email, password }, { prisma });

    expect(user.email).toEqual(email);
    expect(user.isAdmin).toEqual(false);
});

test('Should not register an existing user', async () => {
    const email = 'user@example.com';
    const password = 'myp@ssw0rd';

    await expect(registerMutation(null, { email, password }, { prisma })).rejects.toThrow('User already exist');
});

test('Should install application', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);

    const ctx = { user, prisma };
    expect(await installApplicationMutation(null, { templateId: 1 }, ctx)).toEqual(true);
});

test('Should install application with envs variables', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);

    const template = await prisma.template.findUnique({ where: { name: 'Invoice-ninja' } });

    const ctx = { user, prisma };
    expect(await installApplicationMutation(null, { templateId: template.id }, ctx)).toEqual(true);

    const { envs } = await prisma.application.findUnique({ where: { releaseName: 'invoice-ninja1' }, include: { envs: true } });
    const { value: smtpEncryption } = envs.find((env) => env.name === 'SMTP_ENCRYPTION');

    expect(envs.length).toEqual(10);
    expect(smtpEncryption).toEqual('tls');
});

test('Should set ADMIN_EMAIL & ADMIN_PASSWORD envs variables', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);

    const template = await prisma.template.findUnique({ where: { name: 'Flarum' } });

    const ctx = { user, prisma };
    expect(await installApplicationMutation(null, { templateId: template.id }, ctx)).toEqual(true);

    const { envs } = await prisma.application.findUnique({ where: { releaseName: 'flarum1' }, include: { envs: true } });
    const { value: adminEmail } = envs.find((env) => env.name === 'ADMIN_EMAIL');
    const { value: adminPassword } = envs.find((env) => env.name === 'ADMIN_PASSWORD');

    expect(adminEmail).toEqual('user@example.com');
    expect(adminPassword.length).toEqual(15);
});

test('Should uninstall application', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    const { releaseName } = await prisma.application.findUnique({ where: { id: 1 } });

    const ctx = { user, prisma };
    expect(await uninstallApplicationMutation(null, { releaseName }, ctx)).toEqual(true);

    const { state } = await prisma.application.findUnique({ where: { id: 1 } });

    expect(state).toEqual(STATES.DELETED);
});

test('Should not uninstall application with bad user', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user2@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    const ctx = { user: { ...user, id: 2 }, prisma };
    const { releaseName } = await prisma.application.findUnique({ where: { id: 1 } });
    expect(await uninstallApplicationMutation(null, { releaseName }, ctx)).toEqual(true);

    const { state } = await prisma.application.findUnique({ where: { id: 1 } });

    expect(state).toEqual(STATES.ONLINE);
});

test('Should update admin settings', async () => {
    const ctx = { user: { email: 'admin@example.com', isAdmin: true }, prisma };

    const settings = [
        { name: 'rootDomain', value: 'localhost' },
    ];

    expect(await updateSettingsMutation(null, { settings }, ctx)).toEqual(true);
});

test('Should not update admin settings if user', async () => {
    const ctx = { user: { email: 'user@example.com' }, prisma };

    const settings = [
        { name: 'rootDomain', value: 'localhost' },
    ];

    await expect(updateSettingsMutation(null, { settings }, ctx)).rejects.toThrow('Not authorized');
});

test('Should not install unexisting application', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const ctx = { user, prisma };
    await expect(installApplicationMutation(null, { templateId: 9999 }, ctx)).rejects.toThrow('Not existing application');
});

test('Should return application envs', async () => {
    await reset(prisma);
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const template = await prisma.template.findUnique({ where: { name: 'Flarum' } });

    const ctx = { user, prisma };
    expect(await installApplicationMutation(null, { templateId: template.id }, ctx)).toEqual(true);

    const envs = await applicationEnvsQuery(null, { releaseName: 'flarum1' }, ctx);
    const { value: adminEmail } = envs.find((env) => env.name === 'ADMIN_EMAIL');
    const { value: adminPassword } = envs.find((env) => env.name === 'ADMIN_PASSWORD');

    expect(adminEmail).toEqual('user@example.com');
    expect(adminPassword.length).toEqual(15);
});

test('Should delete account', async () => {
    await reset(prisma);
    await importTemplates(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const ctx = { user, prisma };
    await addApps([
        { templateId: 1, userId: user.id, state: STATES.ONLINE },
        { templateId: 1, userId: user.id, state: STATES.ONLINE },
    ], prisma);

    expect(await deleteAccountMutation(null, null, ctx)).toEqual(true);

    const applications = await prisma.application.findMany({ where: { userId: ctx.user.id, state: STATES.ONLINE } });

    expect(applications.length).toEqual(0);
    expect(await prisma.user.count({ where: { enabled: true } })).toEqual(0);
});

test('Should update first name\'s user', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const firstName = 'Marty';
    const lastName = 'Mcfly';

    const ctx = { user, prisma };
    expect(await updateUserMutation(null, { firstName, lastName }, ctx)).toEqual(true);

    const userUpdated = await prisma.user.findUnique({ where: { id: ctx.user.id } });

    expect(userUpdated.firstName).toEqual(firstName);
    expect(userUpdated.lastName).toEqual(lastName);
});

test('Should update first name\'s user on stripe', async () => {
    await reset(prisma);

    await addSettings([
        { name: 'stripeEnabled', value: 'true' },
        { name: 'stripePublishableKey', value: process.env.STRIPE_PUBLISHABLE_KEY },
        { name: 'stripeSecretKey', value: process.env.STRIPE_SECRET_KEY },
    ], prisma);

    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const ctx = { user, prisma };

    const firstName = 'marty';
    const lastName = 'mcfly';
    expect(await updateUserMutation(null, { firstName, lastName }, ctx)).toEqual(true);

    const userUpdated = await prisma.user.findUnique({ where: { id: ctx.user.id } });

    expect(userUpdated.firstName).toEqual(firstName);
    expect(userUpdated.lastName).toEqual(lastName);
});

test('Should return invoice list', async () => {
    await reset(prisma);

    await addSettings([
        { name: 'stripeEnabled', value: 'true' },
        { name: 'stripePublishableKey', value: process.env.STRIPE_PUBLISHABLE_KEY },
        { name: 'stripeSecretKey', value: process.env.STRIPE_SECRET_KEY },
    ], prisma);

    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const ctx = { user, prisma };
    const invoices = await invoicesQuery(null, null, ctx);

    expect(invoices).toEqual([]);
});

test('Should update application', async () => {
    await reset(prisma);
    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await importTemplates(prisma);
    await addApps([{ templateId: 1, userId: user.id, state: STATES.ONLINE }], prisma);

    const { releaseName, domain } = await prisma.application.findUnique({ where: { id: 1 } });

    const envs = [{ name: 'MAIL_PORT', value: '25' }];

    const ctx = { user, prisma };
    expect(await updateAppMutation(null, { releaseName, envs, domain }, ctx)).toEqual(true);
});
