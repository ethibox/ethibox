import yaml from 'yamljs';
import fetch from 'node-fetch';
import path from 'path';
import https from 'https';
import sha1 from 'node-sha1';
import { checkStatus, findVal, genUniqReleaseName } from './utils';

const agent = new https.Agent({ rejectUnauthorized: false });
const KUBE_APISERVER_ENDPOINT = `https://${process.env.KUBERNETES_SERVICE_HOST}`;
const SWIFT_ENDPOINT = `http://${process.env.SWIFT_SERVICE_HOST}:${process.env.SWIFT_SERVICE_PORT_PT}`;
const CHART_REPOSITORY = process.env.CHART_REPOSITORY || `http://${process.env.ETHIBOX_SERVICE_HOST}:${process.env.ETHIBOX_SERVICE_PORT}/charts`;
const NAMESPACE = 'default';

export const listCharts = () => {
    const chartIndex = yaml.load(path.join(__dirname, (process.env.NODE_ENV === 'production') ? '../' : '../../', 'charts/packages/index.yaml'));
    return Object.values(chartIndex.entries).map(([chart]) => ({ ...chart, category: chart.keywords[0] }));
};

export const stateApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/pods/`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then(({ items }) => {
            if (!items.length) return [];

            return items.map(item => ({
                releaseName: item.metadata.labels.release,
                containersRunning: item.status.hasOwnProperty('containerStatuses') && item.status.containerStatuses.every(container => container.ready), // eslint-disable-line
                message: findVal(item, 'message'),
                reason: findVal(item, 'reason'),
                ready: findVal(item, 'ready'),
            }));
        });

    return apps.map((app) => {
        let state = 'loading';
        if (app.containersRunning) state = 'running';
        if (app.message && app.message.match('unready')) state = 'loading';
        if (app.message && app.message.match('DiskPressure')) state = 'error';
        if (app.message && app.message.match('Insufficient memory')) state = 'error';
        if (app.reason && app.reason === 'CrashLoopBackOff') state = 'error';
        if (app.reason && app.reason === 'Error') state = 'error';
        if (app.ready) state = 'running';
        return { releaseName: app.releaseName, state };
    });
};

export const listApplications = async () => {
    const stateApps = await stateApplications();

    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/services/?labelSelector=heritage=Tiller`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            return data.items.map(item => ({
                name: item.metadata.labels.app,
                releaseName: item.metadata.labels.release.slice(0, -6),
                category: item.metadata.labels.category,
                email: item.metadata.labels.email,
                port: item.spec.ports[0].nodePort,
                state: stateApps[stateApps.findIndex(app => app.releaseName === item.metadata.labels.release)].state,
            }));
        });

    return apps;
};

export const installApplication = async (name, email, releaseName) => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-0.1.0.tgz`;
    const uniqueReleaseName = genUniqReleaseName(releaseName, email);

    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${uniqueReleaseName}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart_url: chartUrl,
            values: { raw: JSON.stringify({ serviceType: 'NodePort', email: sha1(email) }) },
        }),
    })
        .then(checkStatus);
};

export const uninstallApplication = (releaseName, email) => {
    fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${genUniqReleaseName(releaseName, email)}/json?purge=true`, { method: 'DELETE' })
        .then(checkStatus);
};
