import yaml from 'yamljs';
import fetch from 'node-fetch';
import path from 'path';
import https from 'https';
import { checkStatus, findVal } from './utils';

const chartsDirPath = (process.env.NODE_ENV === 'production') ? '../' : '../../';
const agent = new https.Agent({ rejectUnauthorized: false });
const KUBE_APISERVER_ENDPOINT = `https://${process.env.KUBERNETES_SERVICE_HOST}`;
const SWIFT_ENDPOINT = `http://${process.env.SWIFT_SERVICE_HOST}:${process.env.SWIFT_SERVICE_PORT_PT}`;
const CHART_REPOSITORY = 'https://aa7775cc1e612b504155fd08819f4e4514f9ec86@raw.githubusercontent.com/ston3o/ethibox/master/charts/packages';
const NAMESPACE = 'default';

export const checkConfig = () => {
    if (!process.env.SWIFT_SERVICE_HOST || !process.env.SWIFT_SERVICE_PORT_PT) {
        throw new Error('Swift configuration error');
    }

    if (!process.env.KUBERNETES_SERVICE_HOST) {
        throw new Error('Kubernetes configuration error');
    }
};

export const listCharts = () => {
    const chartIndex = yaml.load(path.join(__dirname, chartsDirPath, 'charts/packages/index.yaml'));
    const charts = Object.values(chartIndex.entries).filter(chart => chart[0].name !== 'ethibox').map(chart => ({ name: chart[0].name, icon: chart[0].icon, category: chart[0].keywords[0] }));
    return charts;
};

export const chart = name => listCharts().filter(c => c.name === name)[0];

export const stateApplication = async (releaseName) => {
    const state = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/pods/?labelSelector=release=${releaseName}`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then(res => res.json())
        .then((data) => {
            const pods = data.items;
            const message = findVal(pods, 'message');
            const containerStatuses = pods.map((pod) => {
                return pod.status.hasOwnProperty('containerStatuses') && // eslint-disable-line
                pod.status.containerStatuses.every(container => container.ready);
            });

            if (!pods.length) {
                return 'notexisting';
            }

            if (typeof message !== 'undefined' && message.match('Insufficient memory')) {
                return 'Insufficient memory';
            }

            if (containerStatuses.every(item => item)) {
                return 'running';
            }

            if (!containerStatuses.every(item => item)) {
                return 'loading';
            }

            return 'error';
        });

    return state;
};

export const portApplication = async (releaseName) => {
    const port = await fetch(`${KUBE_APISERVER_ENDPOINT}/api/v1/namespaces/${NAMESPACE}/services/?labelSelector=release=${releaseName}`, {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        agent,
    })
        .then(checkStatus)
        .then(res => res.json())
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
        .then(res => res.json())
        .then((data) => {
            if (typeof data.code !== 'undefined' && data.code === 404) {
                return [];
            }

            return data.items.map((item) => {
                const name = item.metadata.labels.app;
                const releaseName = item.metadata.labels.release;

                return {
                    name,
                    releaseName,
                    icon: chart(name).icon,
                    category: chart(name).category,
                };
            });
        });

    if (!apps.length) {
        return [];
    }

    await Promise.all(apps.map(async (app) => {
        app.port = await portApplication(app.releaseName);
        app.state = await stateApplication(app.releaseName);
    }));

    return apps;
};

export const installApplication = async (name, releaseName) => {
    const chartUrl = `${CHART_REPOSITORY}/${name}-0.1.0.tgz`;

    await fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart_url: chartUrl,
            values: { raw: JSON.stringify({ serviceType: 'NodePort' }) },
        }),
    })
        .then(checkStatus)
        .then(res => res.json());
};

export const uninstallApplication = (releaseName) => {
    fetch(`${SWIFT_ENDPOINT}/tiller/v2/releases/${releaseName}/json?purge=true`, { method: 'DELETE' });
};
