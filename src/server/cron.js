import 'babel-polyfill';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { checkUrl, STATES } from './utils';

const MAX_TASK_TIME = process.env.MAX_TASK_TIME || 15;

export const checkAppsStatus = async (prisma) => {
    const applications = await prisma.application.findMany({ where: { NOT: { state: STATES.DELETED } } });
    const currentDate = new Date();

    for await (const { domain, lastTaskDate } of applications) {
        const start = new Date();
        const isOnline = await checkUrl(`http://${domain}`);
        const expiryTime = new Date(lastTaskDate.setMinutes(lastTaskDate.getMinutes() + MAX_TASK_TIME));
        const responseTime = new Date() - start;

        await prisma.application.update({ where: { domain }, data: { responseTime } });

        if (!isOnline) {
            if (currentDate >= expiryTime) {
                await prisma.application.update({ where: { domain }, data: { state: STATES.OFFLINE } });
            } else {
                await prisma.application.update({ where: { domain }, data: { state: STATES.STANDBY } });
            }
        }

        if (isOnline) {
            await prisma.application.update({ where: { domain }, data: { state: STATES.ONLINE } });
        }
    }
};

const prisma = new PrismaClient();

const job = new CronJob('0 * * * * *', async () => {
    job.stop();

    await checkAppsStatus(prisma);

    job.start();
}, null, process.env.NODE_ENV !== 'test');
