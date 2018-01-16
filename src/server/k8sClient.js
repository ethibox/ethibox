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

export const checkConfig = () => {
    if (!process.env.TOKEN) {
        throw new Error('No kubernetes token');
    }

    if (!process.env.SWIFT_SERVICE_HOST || !process.env.SWIFT_SERVICE_PORT_PT) {
        throw new Error('Swift configuration error');
    }

    if (!process.env.KUBERNETES_SERVICE_HOST) {
        throw new Error('Kubernetes configuration error');
    }
};

export const listCharts = () => {
    const chartIndex = yaml.load(path.join(__dirname, (process.env.NODE_ENV === 'production') ? '../' : '../../', 'charts/packages/index.yaml'));
    return Object.values(chartIndex.entries).map(chart => ({ name: chart[0].name, icon: chart[0].icon, category: chart[0].keywords[0] }));
};

export const chart = name => listCharts().filter(c => c.name === name)[0];

export const stateApplication = async (releaseName) => {
    const stateApp = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/pods/?labelSelector=release=${releaseName}`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            const pods = data.items;
            const message = findVal(pods, 'message');
            const containerStatuses = pods.map((pod) => {
                return pod.status.hasOwnProperty('containerStatuses') && // eslint-disable-line
                pod.status.containerStatuses.every(container => container.ready);
            });

            let state = 'error';

            if (!pods.length) state = 'notexisting';
            if (typeof message !== 'undefined' && message.match('Insufficient memory')) state = 'Insufficient memory';
            if (containerStatuses.every(item => item)) state = 'running';
            if (!containerStatuses.every(item => item)) state = 'loading';

            return state;
        });

    return stateApp;
};

export const portApplication = async (releaseName) => {
    const port = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/services/?labelSelector=release=${releaseName}`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            const services = data.items;
            return services[services.length - 1].spec.ports[0].nodePort;
        });

    return port;
};

export const listApplications = async () => {
    const apps = await fetch(`${KUBE_APISERVER_ENDPOINT}/apis/extensions/v1beta1/namespaces/${NAMESPACE}/ingresses`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then((data) => {
            if (typeof data.code !== 'undefined' && data.code === 404) return [];

            return data.items.map((item) => {
                const name = item.metadata.labels.app;
                const releaseName = item.metadata.labels.release;
                const emailSha1 = item.metadata.labels.email;

                return {
                    name,
                    releaseName,
                    icon: chart(name).icon,
                    category: chart(name).category,
                    email: emailSha1,
                };
            });
        });

    if (!apps.length) return [];

    await Promise.all(apps.map(async (app) => {
        app.port = await portApplication(app.releaseName);
        app.state = await stateApplication(app.releaseName);
    }));

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
