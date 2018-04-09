import yaml from 'yamljs';
import fetch from 'node-fetch';
import path from 'path';
import https from 'https';
import sha1 from 'node-sha1';
import { checkStatus, findVal, genUniqReleaseName } from './utils';

const agent = new https.Agent({ rejectUnauthorized: false });
const KUBE_APISERVER_ENDPOINT = `https://${process.env.KUBERNETES_SERVICE_HOST}`;
const SWIFT_ENDPOINT = `http://${process.env.SWIFT_ETHIBOX_SERVICE_HOST}:${process.env.SWIFT_ETHIBOX_SERVICE_PORT_PT}`;
const CHART_REPOSITORY = process.env.CHART_REPOSITORY || `http://${process.env.ETHIBOX_SERVICE_HOST}:${process.env.ETHIBOX_SERVICE_PORT}/charts`;
const NAMESPACE = 'default';

export const listCharts = () => {
    const chartIndex = yaml.load(path.join(__dirname, (process.env.NODE_ENV === 'production') ? '../' : '../../', 'charts/packages/index.yaml'));
    return Object.values(chartIndex.entries).filter(([chart]) => !chart.name('ethibox|custom')).map(([chart]) => ({ ...chart, category: chart.keywords ? chart.keywords[0] : 'Unknow' }));
};

export const stateApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/pods/`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then(({ items }) => {
            if (!items.length) return [];

            return items.filter(item => !['mysql', 'mariadb', 'mongodb'].includes(item.metadata.labels.app)).map(item => ({
                releaseName: item.metadata.labels.release.slice(0, -6),
                containersRunning: item.status.hasOwnProperty('containerStatuses') && item.status.containerStatuses.every(container => container.ready), // eslint-disable-line
                message: findVal(item, 'message'),
                reason: findVal(item.status.containerStatuses, 'reason'),
                ready: findVal(item, 'ready'),
            }));
        });

    return apps.map((app) => {
        let state = 'loading';
        if (app.containersRunning) state = 'running';
        if (app.message && new RegExp('unready').test(app.message)) state = 'loading';
        if (app.message && new RegExp('DiskPressure').test(app.message)) state = 'error';
        if (app.message && new RegExp('Insufficient memory').test(app.message)) state = 'error';
        if (app.reason && app.reason === 'CrashLoopBackOff') state = 'error';
        if (app.reason && app.reason === 'ContainerCreating') state = 'loading';
        if (app.ready) state = 'running';
        return { releaseName: app.releaseName, state };
    });
};

export const listApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/services/?labelSelector=heritage=Tiller`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            if (!data.items.length) return [];
            return data.items.map(item => ({
                name: item.metadata.labels.app,
                releaseName: item.metadata.labels.release.slice(0, -6),
                category: item.metadata.labels.category,
                email: item.metadata.labels.email,
                port: item.spec.ports[0].nodePort,
                domain: item.metadata.labels.domain,
            }));
        });

    const stateApps = await stateApplications();
    return apps.map((app) => {
        const index = stateApps.findIndex(item => item.releaseName === app.releaseName);
        const { state } = stateApps[index];
        return { ...app, state: state || 'loading' };
    });
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

export const editApplication = async (name, email, releaseName, domainName) => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-0.1.0.tgz`;
    const uniqueReleaseName = genUniqReleaseName(releaseName, email);

    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${uniqueReleaseName}/json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart_url: chartUrl,
            reuse_values: true,
            values: { raw: JSON.stringify({ serviceType: 'NodePort', email: sha1(email), ingress: { enabled: !!domainName, hosts: [domainName] } }) },
        }),
    })
        .then(checkStatus);
};
