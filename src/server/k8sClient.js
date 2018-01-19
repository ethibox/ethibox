import yaml from 'yamljs';
import fetch from 'node-fetch';
import path from 'path';
import https from 'https';
import sha1 from 'node-sha1';
import { checkStatus, findVal } from './utils';

const agent = new https.Agent({ rejectUnauthorized: false });
const KUBE_APISERVER_ENDPOINT = `https://${process.env.KUBERNETES_SERVICE_HOST}`;
const SWIFT_ENDPOINT = `http://${process.env.SWIFT_SERVICE_HOST}:${process.env.SWIFT_SERVICE_PORT_PT}`;
const CHART_REPOSITORY = process.env.CHART_REPOSITORY || `http://${process.env.ETHIBOX_SERVICE_HOST}:${process.env.ETHIBOX_SERVICE_PORT}/charts`;
const NAMESPACE = 'default';

export const listCharts = () => {
    const chartIndex = yaml.load(path.join(__dirname, (process.env.NODE_ENV === 'production') ? '../' : '../../', 'charts/packages/index.yaml'));
    return Object.values(chartIndex.entries).map(chart => ({ name: chart[0].name, icon: chart[0].icon, category: chart[0].keywords[0] }));
};

export const stateApplication = async (releaseName) => {
    const app = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/pods/?labelSelector=release=${releaseName}`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then(({ items }) => ({
            pods: items.length,
            message: findVal(items, 'message'),
            containersRunning: !!items.map(pod => pod.status.containerStatuses.every(container => container.ready)),
        }));

    let state = 'loading';

    if (app.containersRunning) state = 'running';
    if (app.message && app.message.match('unready')) state = 'loading';
    if (app.message && app.message.match('DiskPressure')) state = 'error';
    if (app.message && app.message.match('Insufficient memory')) state = 'error';

    return state;
};

export const listApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/services/?labelSelector=heritage=Tiller`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            return data.items.map(item => ({
                name: item.metadata.labels.app,
                releaseName: item.metadata.labels.release,
                category: item.metadata.labels.category,
                email: item.metadata.labels.email,
                port: item.spec.ports[0].nodePort,
            }));
        });

    if (apps.length) {
        await Promise.all(apps.map(async (app) => {
            app.state = await stateApplication(app.releaseName);
        }));
    }

    return apps;
};

export const installApplication = async (name, email, releaseName) => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-0.1.0.tgz`;

    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart_url: chartUrl,
            values: { raw: JSON.stringify({ serviceType: 'NodePort', email: sha1(email) }) },
        }),
    })
        .then(checkStatus);
};

export const uninstallApplication = (releaseName) => {
    fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}/json?purge=true`, { method: 'DELETE' }).then(checkStatus);
};
