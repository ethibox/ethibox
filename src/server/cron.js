import 'babel-polyfill';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { installApplication, uninstallApplication } from './portainer';
import { TASKS, STATES, EVENTS, secret, checkUrl, asyncForEach, checkDnsRecord, getSettings, getIp, webhookRequest } from './utils';

const sendWebhooks = async (event, data, prisma) => {
    const rootDomain = (await getSettings('rootDomain', prisma)) || 'local.ethibox.fr';
    const webhooks = await prisma.webhook.findMany({ where: { event } });
    await asyncForEach(webhooks, async ({ targetUrl }) => {
        webhookRequest(targetUrl, { ...data, rootDomain });
    });
};

export const installApplications = async (prisma) => {
    const installingApplications = await prisma.application.findMany({ where: { task: TASKS.INSTALL }, include: { user: true, envs: true, template: true } });
    const globalEnvs = await prisma.env.findMany({ where: { global: true } });

    await asyncForEach(installingApplications, async (app) => {
        const { id, template, releaseName, domain, user } = app;
        const token = jwt.sign({ email: user.email }, secret, { expiresIn: `${template.trial + 1}d` });
        const stackFile = template.auto ? template.stackFile : 'waiting.yml';

        const envs = app.envs.concat(globalEnvs);
        envs.push({ name: 'DOMAIN', value: domain });
        envs.push({ name: 'NUMBER', value: id.toString() });

        await installApplication(releaseName, domain, template.repositoryUrl, stackFile, envs).then(async () => {
            await prisma.application.update({ where: { releaseName }, data: { task: null } });
            await sendWebhooks(EVENTS.INSTALL, { ...app, token }, prisma);
        }).catch((error) => {
            throw new Error(error);
        });

        return app;
    });
};

export const uninstallApplications = async (prisma) => {
    const uninstallingApplications = await prisma.application.findMany({ where: { task: TASKS.UNINSTALL }, include: { user: true, template: true } });

    await asyncForEach(uninstallingApplications, async (app) => {
        const { user, releaseName } = app;
        const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1d' });

        await uninstallApplication(releaseName).then(async () => {
            await prisma.application.update({ where: { releaseName }, data: { task: null, state: STATES.DELETED } });
            await sendWebhooks(EVENTS.UNINSTALL, { ...app, token }, prisma);
        }).catch((error) => {
            throw new Error(error);
        });
    });
};

export const checkAppsStatus = async (prisma) => {
    const rootDomain = (await getSettings('rootDomain', prisma)) || 'local.ethibox.fr';
    const ip = await getIp(rootDomain);
    const maxTaskTime = 15;

    const applications = await prisma.application.findMany();

    await asyncForEach(applications, async (app) => {
        const { domain, state, lastTaskDate } = app;
        const url = `http://${domain}`;
        const currentDate = new Date();
        const expiryTime = new Date(lastTaskDate.setMinutes(lastTaskDate.getMinutes() + maxTaskTime));

        if ([STATES.INSTALLING, STATES.EDITING].includes(state)) {
            if (currentDate >= expiryTime) {
                if (await checkUrl(url).then(() => true).catch(() => false)) {
                    await prisma.application.update({ where: { domain }, data: { state: STATES.RUNNING, error: null } });
                    return;
                }

                await prisma.application.update({ where: { domain }, data: { error: 'Application stuck' } });
                return;
            }

            if (await checkUrl(url).catch(async (error) => {
                await prisma.application.update({ where: { domain }, data: { error: error.message } });
            })) {
                await prisma.application.update({ where: { domain }, data: { state: STATES.RUNNING, error: null } });
                return;
            }
        }

        let responseTime = 0;

        if (state === STATES.RUNNING) {
            if (!(await checkDnsRecord(domain, ip))) {
                await prisma.application.update({ where: { domain }, data: { error: 'DNS Error' } });
                return;
            }

            const start = new Date();
            if (!(await checkUrl(url).catch(async (error) => {
                await prisma.application.update({ where: { domain }, data: { error: error.message } });
            }))) {
                return;
            }
            responseTime = new Date() - start;
        }

        await prisma.application.update({ where: { domain }, data: { error: null, responseTime } });
    });
};

const prisma = new PrismaClient();

const job = new CronJob('0 * * * * *', async () => {
    job.stop();

    try {
        await installApplications(prisma);
    } catch ({ message }) {
        console.error(message);
    }

    try {
        await uninstallApplications(prisma);
    } catch ({ message }) {
        console.error(message);
    }

    try {
        await checkAppsStatus(prisma);
    } catch ({ message }) {
        console.error(message);
    }

    job.start();
}, null, process.env.NODE_ENV !== 'test');
