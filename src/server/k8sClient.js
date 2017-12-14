import yaml from 'yamljs';
import fetch from 'node-fetch';

export const listCharts = () => {
    const chartIndex = yaml.load(`${__dirname}/../../charts/index.yaml`);
    return Object.values(chartIndex.entries).map(chart => ({ name: chart[0].name, icon: chart[0].icon, category: chart[0].keywords[0] }));
};

export const stateApplication = async (releaseName) => {
    const state = await fetch(`http://127.0.0.1:8001/api/v1/namespaces/default/pods/?labelSelector=release=${releaseName}`)
        .then(res => res.json())
        .then((data) => {
            if (!data.items.length) {
                return 'notexisting';
            }

            if (data.items.some(item => item.metadata.hasOwnProperty('deletionTimestamp'))) { // eslint-disable-line
                return 'uninstalling';
            }

            if (data.items.every(item => item.status.containerStatuses[0].hasOwnProperty('ready') && item.status.containerStatuses[0].ready)) { // eslint-disable-line
                return 'running';
            }

            if (data.items.some(item => item.status.containerStatuses[0].hasOwnProperty('ready'))) { // eslint-disable-line
                return 'installing';
            }

            return 'problem';
        });

    return state;
};

export const portApplication = async (name, releaseName) => {
    const port = await fetch(`http://127.0.0.1:8001/api/v1/namespaces/default/services/?labelSelector=app=${name},release=${releaseName}`)
        .then(res => res.json())
        .then(data => data.items[0].spec.ports[0].nodePort);

    return port;
};

export const listApplications = async () => {
    const charts = listCharts();

    const apps = await fetch('http://127.0.0.1:8001/apis/extensions/v1beta1/namespaces/default/ingresses')
        .then(res => res.json())
        .then(data => data.items.map((item) => {
            const name = item.metadata.labels.app;
            const releaseName = item.metadata.labels.release;
            const { icon } = charts.filter(chart => chart.name === name)[0];

            return {
                name,
                releaseName,
                icon,
                category: 'blog',
            };
        }));

    await Promise.all(apps.map(async (app) => {
        app.port = await portApplication(app.name, app.releaseName);
        app.state = await stateApplication(app.releaseName);
    }));

    return apps;
};

export const installApplication = (name, releaseName) => {
    const repo = 'https://aa7775cc1e612b504155fd08819f4e4514f9ec86@raw.githubusercontent.com/ston3o/ethibox/master/charts';
    const chartUrl = `${repo}/${name}-0.1.0.tgz`;

    fetch(`http://192.168.1.58:32428/tiller/v2/releases/${releaseName}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart_url: chartUrl,
            values: { raw: JSON.stringify({ serviceType: 'NodePort' }) },
        }),
    });
};

export const uninstallApplication = (releaseName) => {
    fetch(`http://192.168.1.58:32428/tiller/v2/releases/${releaseName}/json?purge=true`, { method: 'DELETE' });
};
