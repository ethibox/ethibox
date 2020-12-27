import express from 'express';
import {
    reset,
    addUsers,
    addApps,
    updateApp,
    getApps,
    addSettings,
    importTemplates,
    deleteUser,
    deleteApp,
} from './fixture';

const app = express();

app.post('/reset', async (req, res) => {
    const { prisma } = req;
    await reset(prisma);

    return res.send('ok');
});

app.post('/users', async (req, res) => {
    const { prisma } = req;
    const { users } = req.body;

    await addUsers(users, prisma);

    return res.send('ok');
});

app.post('/apps', async (req, res) => {
    const { prisma } = req;
    const { apps } = req.body;

    await addApps(apps, prisma);

    return res.send('ok');
});

app.post('/import', async (req, res) => {
    const { prisma } = req;
    await importTemplates(prisma);

    return res.send('ok');
});

app.put('/apps/:releaseName', async (req, res) => {
    const { prisma } = req;
    const { releaseName } = req.params;
    const state = req.body.state || null;
    const task = req.body.task || null;

    const data = { state, task };

    await updateApp(releaseName, data, prisma);

    return res.send('ok');
});

app.get('/apps', async (req, res) => {
    const { prisma } = req;
    const applications = await getApps(prisma);

    return res.send(applications);
});

app.post('/settings', async (req, res) => {
    const { prisma } = req;
    const { settings } = req.body;

    await addSettings(settings, prisma);

    return res.send('ok');
});

app.delete('/apps/:releaseName', async (req, res) => {
    const { prisma } = req;
    const { releaseName } = req.params;

    await deleteApp(releaseName, prisma);

    return res.send('ok');
});

app.delete('/users/:id', async (req, res) => {
    const { prisma } = req;
    const { id } = req.params;

    await deleteUser(id, prisma);

    return res.send('ok');
});

export default app;
