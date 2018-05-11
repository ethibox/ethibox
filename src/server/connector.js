import fs from 'fs';
import yaml from 'yamljs';
import fetch from 'node-fetch';
import path from 'path';
import https from 'https';
import { checkStatus, findVal, ACTIONS, STATES } from './utils';
import { sequelize, Package, Application } from './models';

const TOKEN_PATH = `${process.env.TELEPRESENCE_ROOT || ''}/var/run/secrets/kubernetes.io/serviceaccount/token`;
const TOKEN = fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf8') : process.env.TOKEN;
const KUBE_APISERVER_IP = process.env.KUBERNETES_SERVICE_HOST || process.env.KUBE_APISERVER_IP;
const KUBE_APISERVER_ENDPOINT = process.env.KUBERNETES_SERVICE_HOST ? `https://${process.env.KUBERNETES_SERVICE_HOST}` : `https://${KUBE_APISERVER_IP}:8443`;
const SWIFT_ENDPOINT = `${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/kube-system/services/http:swift-ethibox:9855/proxy`;
const CHART_REPOSITORY = process.env.CHART_REPOSITORY || 'https://github.com/ston3o/ethibox/raw/master/charts/packages';

if (!TOKEN || !KUBE_APISERVER_IP) {
    console.error('Error: Kubernetes configuration missing!');
    console.error('Error: Add KUBE_APISERVER_IP and TOKEN environment variables');
}

const agent = new https.Agent({ rejectUnauthorized: false });

const listPackages = () => {
    const packageIndex = yaml.load(path.join(__dirname, (process.env.NODE_ENV === 'production') ? '../' : '../../', 'charts/packages/index.yaml'));
    return Object.values(packageIndex.entries).filter(([pkg]) => !pkg.name.match('ethibox|custom')).map(([pkg]) => ({ ...pkg, category: pkg.keywords ? pkg.keywords[0] : 'Unknow' }));
};

listPackages().forEach(async ({ name, category }) => {
    if (!await Package.findOne({ where: { name }, raw: true })) {
        Package.create({ name, category });
    }
    Package.update({ name, category }, { where: { name } });
});

export const stateApplications = async () => {
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
        });

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

export const listApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/default/services/?labelSelector=heritage=Tiller`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            if (!data.items.length) return [];
            return data.items.map(item => ({
                name: item.metadata.labels.app,
                releaseName: item.metadata.labels.release,
                ip: KUBE_APISERVER_IP,
                port: item.spec.ports[0].nodePort,
                domain: item.metadata.labels.domain,
            }));
        });

    const stateApps = await stateApplications();
    return apps.map((app) => {
        const index = stateApps.findIndex(item => item.releaseName === app.releaseName);
        const { state, error } = stateApps[index];
        return { ...app, error, state: state || 'loading' };
    });
};

export const installApplication = async (name, userId, releaseName) => {
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
        .then(checkStatus);
};

export const uninstallApplication = (releaseName, userId) => {
    fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}-${userId}/json?purge=true`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        method: 'DELETE',
        agent,
    })
        .then(checkStatus);
};

export const editApplication = async (name, userId, releaseName, domainName, version = '0.1.0') => {
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
        .then(checkStatus);
};

let isRunning;
setInterval(async () => {
    if (!isRunning) {
        isRunning = true;

        const applications = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, applications.ip as ip, userId, action
           FROM applications
           LEFT JOIN packages AS package ON applications.packageId = package.id
           INNER JOIN users AS user ON applications.userId = user.id`, { type: sequelize.QueryTypes.SELECT });

        const k8sApps = await listApplications();

        k8sApps.forEach((app) => {
            const ip = KUBE_APISERVER_IP;
            const { port, state, error } = app;
            const userId = (app.releaseName.match(/[0-9]+$/) && app.releaseName.match(/[0-9]+$/)[0]) || 0;
            const releaseName = app.releaseName.replace(/-[0-9]+$/, '');
            Application.update({ ip, port, state, error }, { where: { releaseName, userId } });
        });

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

        isRunning = false;
    }
}, 5000);
