import fs from 'fs';
import yaml from 'yamljs';
import fetch from 'node-fetch';
import https from 'https';
import winston from 'winston';
import { checkStatus, findVal, publicIp, ACTIONS, STATES } from './utils';
import { sequelize, Package, Application } from './models';

const TOKEN_PATH = `${process.env.TELEPRESENCE_ROOT || ''}/var/run/secrets/kubernetes.io/serviceaccount/token`;
const TOKEN = fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf8') : process.env.TOKEN;
const KUBE_APISERVER_IP = process.env.KUBERNETES_SERVICE_HOST || process.env.KUBE_APISERVER_IP;
const KUBE_APISERVER_ENDPOINT = process.env.KUBERNETES_SERVICE_HOST ? `https://${process.env.KUBERNETES_SERVICE_HOST}` : `https://${KUBE_APISERVER_IP}:8443`;
const SWIFT_ENDPOINT = `${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/kube-system/services/http:swift-ethibox:9855/proxy`;
const CHART_REPOSITORY = process.env.CHART_REPOSITORY || 'https://charts.ethibox.fr/packages/';

const agent = new https.Agent({ rejectUnauthorized: false });

const stateApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/default/pods/`, { headers: { Authorization: `Bearer ${TOKEN}` }, agent })
        .then(checkStatus)
        .then(({ items }) => {
            if (!items.length) return [];

            return items.filter(item => !['mysql', 'mariadb', 'mongodb'].includes(item.metadata.labels.app)).map(item => ({
                releaseName: item.metadata.labels.release,
                containersRunning: item.status.hasOwnProperty('containerStatuses') && item.status.containerStatuses.every(container => container.ready), // eslint-disable-line
                message: findVal(item, 'message'),
                reason: findVal(item.status.containerStatuses, 'reason'),
                ready: findVal(item, 'ready'),
            }));
        })
        .catch(message => winston.log('error', message));

    return apps.map((app) => {
        let state = STATES.LOADING;
        let error = null;
        if (app.containersRunning) state = STATES.RUNNING;
        if (app.message && new RegExp('unready').test(app.message)) state = STATES.LOADING;
        if (app.reason && app.reason === 'ContainerCreating') state = STATES.LOADING;
        if (app.message && new RegExp('DiskPressure').test(app.message)) error = 'Disk Pressure';
        if (app.message && new RegExp('Insufficient memory').test(app.message)) error = 'Insufficient memory';
        if (app.reason && ['CrashLoopBackOff', 'ImagePullBackOff', 'InvalidImageName'].includes(app.reason)) error = app.reason;
        if (app.reason && app.reason === 'Error') error = 'Unknown error';
        if (app.ready) state = STATES.RUNNING;
        return { releaseName: app.releaseName, state, error };
    });
};

const listApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/default/services/?labelSelector=heritage=Tiller`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            if (!data.items.length) return [];
            return data.items.filter(item => !['mysql', 'mariadb', 'mongodb'].includes(item.metadata.labels.app)).map(item => ({
                name: item.metadata.labels.app,
                releaseName: item.metadata.labels.release,
                port: item.spec.ports[0].nodePort,
                domain: item.metadata.labels.domain,
            }));
        })
        .catch(message => winston.log('error', message));

    const stateApps = await stateApplications();
    return apps.map((app) => {
        const index = stateApps.findIndex(item => item.releaseName === app.releaseName);
        const { state, error } = stateApps[index];
        return { ...app, error, state: state || 'loading' };
    });
};

const installApplication = async (name, userId, releaseName) => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-0.1.0.tgz`;
    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}-${userId}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({
            chart_url: chartUrl,
            values: { raw: JSON.stringify({ serviceType: 'NodePort' }) },
        }),
        agent,
    })
        .then(checkStatus)
        .catch(message => winston.log('error', message));
};

const uninstallApplication = (releaseName, userId) => {
    fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}-${userId}/json?purge=true`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        method: 'DELETE',
        agent,
    })
        .then(checkStatus)
        .catch(message => winston.log('error', message));
};

const editApplication = async (name, userId, releaseName, domainName, version = '0.1.0') => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-${version}.tgz`;
    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}-${userId}/json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({
            chart_url: chartUrl,
            reuse_values: true,
            values: { raw: JSON.stringify({ serviceType: 'NodePort', ingress: { enabled: !!domainName, hosts: [domainName] } }) },
        }),
        agent,
    })
        .then(checkStatus)
        .catch(message => winston.log('error', message));
};

const synchronize = async () => {
    const k8sApps = await listApplications();
    process.env.PUBLIC_IP = process.env.PUBLIC_IP || await publicIp();
    const ip = process.env.TELEPRESENCE_ROOT ? '192.168.99.100' : (process.env.KUBE_APISERVER_IP || process.env.PUBLIC_IP);

    k8sApps.forEach((app) => {
        const { port, state, error } = app;
        const userId = (app.releaseName.match(/[0-9]+$/) && app.releaseName.match(/[0-9]+$/)[0]) || 0;
        const releaseName = app.releaseName.replace(/-[0-9]+$/, '');
        Application.update({ ip, port, state, error }, { where: { releaseName, userId } });
    });

    const applications = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, applications.ip as ip, userId, action
       FROM applications
       LEFT JOIN packages AS package ON applications.packageId = package.id
       INNER JOIN users AS user ON applications.userId = user.id`, { type: sequelize.QueryTypes.SELECT });

    applications.forEach(async (app) => {
        const { name, userId, action, releaseName, domainName } = app;

        switch (action) {
            case ACTIONS.INSTALL:
                await installApplication(name, userId, releaseName);
                break;
            case ACTIONS.UNINSTALL:
                await uninstallApplication(releaseName, userId);
                Application.destroy({ where: { releaseName } });
                break;
            case ACTIONS.EDIT:
                await editApplication(name, userId, releaseName, domainName);
                break;
            default:
                break;
        }

        Application.update({ action: null }, { where: { releaseName } });
    });
};

const listPackages = async () => {
    const index = await fetch(`${CHART_REPOSITORY}/index.yaml`).then(res => res.text());
    const packages = await yaml.parse(index).entries;

    return Object.values(packages)
        .filter(([pkg]) => !pkg.name.match('ethibox|custom'))
        .map(([pkg]) => ({ ...pkg, category: pkg.keywords ? pkg.keywords[0] : 'Unknow' }));
};

(async () => {
    const packages = await listPackages();
    packages.forEach(async ({ name, icon, category }) => {
        if (!await Package.findOne({ where: { name }, raw: true })) {
            Package.create({ name, icon, category });
        }
        Package.update({ name, icon, category }, { where: { name } });
    });
})();

if (TOKEN && KUBE_APISERVER_IP) {
    let isSynchronizationRunning;
    setInterval(async () => {
        if (!isSynchronizationRunning) {
            isSynchronizationRunning = true;
            await synchronize();
            isSynchronizationRunning = false;
        }
    }, 5000);
} else {
    winston.log('error', 'Kubernetes configuration missing!');
    winston.log('error', 'Add KUBE_APISERVER_IP and TOKEN environment variables');
}
