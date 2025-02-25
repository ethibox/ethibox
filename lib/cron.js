import 'dotenv/config';
import fetch from 'node-fetch';
import { CronJob } from 'cron';
import { Op, App } from '@lib/orm';

const MAX_TASK_TIME = 3;
let executionInProgress = false;

export const timeout = (ms, promise) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error('timeout'));
    }, ms);
    promise.then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
    }, (err) => {
        clearTimeout(timeoutId);
        reject(err);
    });
});

export const checkUrl = (url, retry = 1) => new Promise((resolve) => {
    timeout(10000, fetch(url, { redirect: 'follow' })).then(({ status }) => {
        if (status === 200 || status === 401) {
            resolve(true);
        } else {
            resolve(false);
        }
    }).catch((e) => {
        if (e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || e.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
            resolve(false);
        }

        resolve(false);
    });
}).then(async (response) => {
    if (retry >= 3) return false;

    if (!response) {
        const newCheck = await checkUrl(url, retry + 1);
        return newCheck;
    }

    return true;
});

export const checkAppsStatus = async () => {
    executionInProgress = true;
    const applications = await App.findAll({ where: { [Op.not]: { state: 'deleted' } } });

    for await (const { domain, updatedAt } of applications) {
        const start = new Date();
        const isOnline = await checkUrl(`http://${domain}`);
        const responseTime = new Date() - start;
        const expiryTime = new Date((new Date(updatedAt)).setMinutes((new Date(updatedAt)).getMinutes() + MAX_TASK_TIME));
        const currentDate = new Date();

        await App.update({ responseTime }, { where: { domain }, attributes: { exclude: ['updatedAt'] }, silent: true });

        if (isOnline) {
            await App.update({ state: 'online' }, { where: { domain }, silent: true });
        }

        if (!isOnline) {
            await App.update({ state: currentDate >= expiryTime ? 'offline' : 'standby' }, { where: { domain, state: { [Op.not]: 'deleted' } }, silent: true });
        }
    }

    executionInProgress = false;
};

const job = new CronJob('0 * * * * *', async () => {
    job.stop();

    if (!executionInProgress) {
        await checkAppsStatus();
    }

    job.start();
}, null, process.env.NODE_ENV !== 'test');
