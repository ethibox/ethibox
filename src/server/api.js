import express from 'express';
import { listApplications, installApplication, uninstallApplication, listCharts, stateApplication } from './k8sClient';

const api = express();

api.get('/applications', async (req, res) => {
    const apps = await listApplications();
    return res.json(apps);
});

api.post('/applications', (req, res) => {
    const { name, releaseName } = req.body;
    installApplication(name, releaseName);
    return res.json('installed');
});

api.delete('/applications/:releaseName', (req, res) => {
    const { releaseName } = req.params;
    uninstallApplication(releaseName);
    return res.json('uninstalled');
});

api.get('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    const state = await stateApplication(releaseName);
    return res.json({ releaseName, state });
});

api.get('/charts', (req, res) => {
    const charts = listCharts();
    res.json(charts);
});

export default api;
