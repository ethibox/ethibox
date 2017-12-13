import express from 'express';
import { listApplications, installApplication, uninstallApplication, listCharts } from './k8sClient';

const api = express();

api.get('/', (req, res) => {
    res.json({ response: 'Hello api!' });
});

api.post('/application/install', (req, res) => {
    const { name, releaseName } = req.body;

    installApplication(name, releaseName);
    return res.json('installed');
});

api.post('/application/uninstall', (req, res) => {
    const { releaseName } = req.body;

    uninstallApplication(releaseName);
    return res.json('uninstalled');
});

api.get('/application/list', async (req, res) => {
    const apps = await listApplications();
    return res.json(apps);
});

api.get('/chart/list', (req, res) => {
    const charts = listCharts();
    res.json(charts);
});

export default api;
