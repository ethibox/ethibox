import fs from 'fs';
import path from 'path';
import os from 'os';
import cron from 'node-cron';
import { App, Op } from './orm.js';
import { STATE, STANDBY_TIMEOUT } from './constants.js';

const lockFile = path.join(os.tmpdir(), 'ethibox-cron.lock');

export const timeout = (ms, promise) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error('timeout'));
    }, ms);
    promise.then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
    }, (err) => {
        clearTimeout(timeoutId);
        reject(new Error(err));
    });
});

export const checkUrl = (url, retry = 1) => new Promise((resolve) => {
    timeout(10000, fetch(url, { headers: { Accept: 'text/html,*/*' }, redirect: 'follow' })).then(({ status }) => {
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

export const getAppState = async ({ domain, state, updatedAt }) => {
    const isOnline = await checkUrl(`http://${domain}`);

    if (isOnline) return STATE.ONLINE;

    if (state === STATE.ONLINE) return STATE.STANDBY;

    if (Date.now() - new Date(updatedAt).getTime() < STANDBY_TIMEOUT) {
        return state;
    }

    return STATE.OFFLINE;
};

const executeJob = async () => {
    try {
        fs.writeFileSync(lockFile, process.pid.toString(), { flag: 'wx' });
    } catch (e) {
        if (e.code === 'EEXIST') return;
        throw e;
    }

    const apps = await App.findAll({ where: { [Op.not]: { state: STATE.DELETED } }, raw: false });

    for await (const app of apps) {
        const start = Date.now();
        const state = await getAppState(app);
        const responseTime = Date.now() - start;

        await App.update({ state, responseTime }, { where: { id: app.id, state: { [Op.not]: STATE.DELETED } }, silent: true });
    }

    fs.unlinkSync(lockFile);
};

const job = cron.schedule('* * * * *', executeJob, { scheduled: false });

export const startCron = () => {
    if (global.cronStarted) return;
    job.start();
    global.cronStarted = true;
};
