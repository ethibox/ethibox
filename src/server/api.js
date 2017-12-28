import express from 'express';
import { checkConfig, listApplications, installApplication, uninstallApplication, listCharts, stateApplication, portApplication } from './k8sClient';

const api = express();

api.get('/applications', async (req, res) => {
    try {
        checkConfig();
        const apps = await listApplications();
        return res.json(apps);
    } catch ({ message }) {
        return res.status(500).send({ code: 1, message });
    }
});

api.post('/applications', async (req, res) => {
    try {
        const { name, releaseName } = req.body;
        await installApplication(name, releaseName);
        return res.json('installed');
    } catch (e) {
        return res.status(500).send({ code: 2, message: 'Something failed!' });
    }
});

api.delete('/applications/:releaseName', (req, res) => {
    try {
        const { releaseName } = req.params;
        uninstallApplication(releaseName);
        return res.json('uninstalled');
    } catch (e) {
        return res.status(500).send({ code: 3, message: 'Something failed!' });
    }
});

api.get('/applications/:releaseName', async (req, res) => {
    try {
        const { releaseName } = req.params;
        const state = await stateApplication(releaseName);

        if (state === 'notexisting') {
            return res.json('notexisting');
        }

        const port = await portApplication(releaseName);
        return res.json({ releaseName, state, port });
    } catch (e) {
        return res.status(500).send({ code: 4, message: 'Something failed!' });
    }
});

api.get('/charts', (req, res) => {
    try {
        const charts = listCharts();
        return res.json(charts);
    } catch (e) {
        return res.status(500).send({ code: 5, message: 'Something failed!' });
    }
});

export default api;
