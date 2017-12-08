import express from 'express';
import yaml from 'yamljs';

const api = express();

api.get('/', (req, res) => {
    res.json({ response: 'Hello api!' });
});

api.get('/charts', (req, res) => {
    const chartIndex = yaml.load(`${__dirname}/../../charts/index.yaml`);
    const charts = Object.values(chartIndex.entries).map(chart => ({ name: chart[0].name, icon: chart[0].icon }));

    res.json(charts);
});

export default api;
