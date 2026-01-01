import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cron from 'node-cron';
import { deploy } from './docker.js';
import { App, Op, Env } from './orm.js';
import { fetchTemplates } from './utils.js';
import { STATE, STANDBY_TIMEOUT, AUTO_UPGRADE } from './constants.js';

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

const runWithLock = (name, fn) => async () => {
    const lockFile = path.join(os.tmpdir(), `ethibox-${name}.lock`);

    try {
        fs.writeFileSync(lockFile, process.pid.toString(), { flag: 'wx' });
    } catch (e) {
        if (e.code === 'EEXIST') return;
        throw e;
    }

    try {
        await fn();
    } finally {
        fs.unlinkSync(lockFile);
    }
};

const monitor = async () => {
    const apps = await App.findAll({ where: { state: { [Op.notIn]: [STATE.DELETED, STATE.WAITING] } }, raw: false });

    for await (const app of apps) {
        const start = Date.now();
        const state = await getAppState(app);
        const responseTime = Date.now() - start;

        await App.update({ state, responseTime }, { where: { id: app.id, state: { [Op.notIn]: [STATE.DELETED, STATE.WAITING] } }, silent: true });
    }
};

const upgrade = async () => {
    if (!AUTO_UPGRADE) return;

    const templates = await fetchTemplates(true, true);
    const apps = await App.findAll({ where: { state: STATE.ONLINE, commit: { [Op.not]: null } }, include: Env, raw: false });

    for await (const app of apps) {
        await app.reload();
        const template = templates.find((t) => t.name.toLowerCase() === app.name);

        if (app.state === STATE.ONLINE && template?.commit && app.commit !== template.commit) {
            const envs = app.envs.concat([
                { name: 'DOMAIN', value: app.domain },
                { name: 'NUMBER', value: `${app.id}` },
            ]);

            await deploy(template.stackfile, app.releaseName, envs);
            await App.update({ commit: template.commit }, { where: { id: app.id }, silent: true });
        }
    }
};

const jobs = [
    { schedule: '* * * * *', name: 'monitor', fn: monitor },
    { schedule: '*/5 * * * *', name: 'upgrade', fn: upgrade },
];

export const startCron = () => {
    if (global.cronStarted) return;

    jobs.forEach((job) => {
        cron.schedule(job.schedule, runWithLock(job.name, job.fn));
    });

    global.cronStarted = true;
};
