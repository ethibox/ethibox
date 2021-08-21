import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { templates } from './templates.json';
import { upsertCustomer } from '../stripe';
import { getSettings, generateReleaseName } from '../utils';

export const addUser = async (user, prisma) => {
    const { email, password, isAdmin } = user;
    const hashPassword = await bcrypt.hash(password, 10);

    const settings = await getSettings(null, prisma);
    const { stripeEnabled, stripeSecretKey } = settings;

    const data = await prisma.user.create({
        data: { email, password: hashPassword, isAdmin: isAdmin || false },
    });

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        await upsertCustomer(stripe, data.id, email).catch(() => false);
    }

    return data;
};

export const addUsers = async (users, prisma) => {
    const results = [];

    for (const user of users) {
        results.push(await addUser(user, prisma));
    }

    return results;
};

export const addApps = async (apps, prisma) => {
    const rootDomain = 'localhost';

    for await (const app of apps) {
        const { templateId, userId, task, state, error, domain, lastTaskDate } = app;
        const template = await prisma.template.findUnique({ where: { id: templateId } });

        if (!template) throw new Error('No template found');

        const releaseName = await generateReleaseName(template.name, prisma);

        await prisma.application.create({
            data: {
                task,
                state,
                error,
                releaseName,
                lastTaskDate,
                domain: domain || `${releaseName}.${rootDomain}`,
                user: { connect: { id: userId } },
                template: { connect: { id: templateId } },
            },
        });
    }
};

export const updateApp = async (releaseName, data, prisma) => {
    await prisma.application.update({ where: { releaseName }, data });
};

export const getApps = async (prisma) => {
    const applications = await prisma.application.findMany({ include: { template: true } });

    return applications.map((app) => ({ ...app, ...app.template }));
};

export const deleteUser = async (id, prisma) => {
    await prisma.user.delete({ where: { id: Number(id) } });
};

export const deleteApp = async (releaseName, prisma) => {
    await prisma.application.delete({ where: { releaseName } });
};

export const addSettings = async (settings, prisma) => {
    for (const setting of settings) {
        const { name, value } = setting;

        await prisma.setting.upsert({
            where: { name },
            create: { name, value },
            update: { name, value },
        });
    }
};

export const importTemplates = async (prisma) => {
    for await (const template of templates) {
        const { title: name, description, categories: [category], logo, website, auto, repository: { url: repositoryUrl, stackfile: stackFile }, price, trial, adminPath, env: envs } = template;

        await prisma.template.upsert({
            where: { name },
            create: { name, description, category, logo, website, auto, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
            update: { name, description, category, logo, website, auto, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
        });
    }
};

export const addWebhooks = async (webhooks, prisma) => {
    await prisma.webhook.deleteMany();

    for (const { event, targetUrl } of webhooks) {
        await prisma.webhook.create({ data: { event, targetUrl } });
    }
};

export const reset = async (prisma) => {
    await prisma.setting.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.env.deleteMany();
    await prisma.application.deleteMany();
    await prisma.template.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$queryRaw('DELETE FROM sqlite_sequence WHERE name="Setting";');
    await prisma.$queryRaw('DELETE FROM sqlite_sequence WHERE name="Webhook";');
    await prisma.$queryRaw('DELETE FROM sqlite_sequence WHERE name="Env";');
    await prisma.$queryRaw('DELETE FROM sqlite_sequence WHERE name="Application";');
    await prisma.$queryRaw('DELETE FROM sqlite_sequence WHERE name="Template";');

    await prisma.$queryRaw(`UPDATE SQLITE_SEQUENCE SET seq = "${Date.now()}";`);
};
