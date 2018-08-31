import express from 'express';
import bcrypt from 'bcrypt';
import { Package, Application, User, Settings } from './models';
import { reset, synchronizeStore } from './utils';
import { initializeSettings } from './initialize';

const app = express();

app.post('/packages', async (req, res) => {
    const { packages } = req.body;
    await Package.bulkCreate(packages);
    return res.send('ok');
});

app.post('/applications', async (req, res) => {
    const { applications } = req.body;
    applications.forEach((a) => {
        const application = Application.build(a);
        application.setUser(a.user, { save: false });
        application.setPackage(a.pkg, { save: false });
        application.save();
    });
    return res.send('ok');
});

app.post('/settings', async (req, res) => {
    const { settings } = req.body;
    await Settings.bulkCreate(settings);
    return res.send('ok');
});

app.post('/users', async (req, res) => {
    const { users } = req.body;
    users.map((user) => {
        const hashPassword = bcrypt.hashSync(user.password, 10);
        user.password = hashPassword;
        return user;
    });
    await User.bulkCreate(users);
    return res.send('ok');
});

app.post('/reset', async (req, res) => {
    const { defaultSettings } = req.body;
    await reset();
    const { storeRepositoryUrl } = await initializeSettings({ ...defaultSettings, disableOrchestratorSync: true });
    await synchronizeStore(storeRepositoryUrl);
    return res.send('ok');
});

app.delete('/packages', async (req, res) => {
    await Package.destroy({ force: true, truncate: true, cascade: true });
    return res.send('ok');
});

app.delete('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    await Application.destroy({ where: { releaseName } });
    return res.send('ok');
});

app.put('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    const { state } = req.body;
    await Application.update({ state }, { where: { releaseName } });
    return res.send('ok');
});

app.get('/users', async (req, res) => {
    const users = await User.findAll();
    return res.json(users);
});

app.get('/packages', async (req, res) => {
    const packages = await Package.findAll();
    return res.json(packages);
});

app.get('/apps.json', async (req, res) => {
    const appsFile = [
        {
            name: 'wordpress',
            icon: 'https://store.ethibox.io/charts/wordpress/icon.png',
            category: 'Blog',
            stackFileUrl: 'https://store.ethibox.io/packages/wordpress-0.1.0.tgz',
            orchestrator: 'kubernetes',
        },
        {
            name: 'etherpad',
            icon: 'https://store.ethibox.io/charts/etherpad/icon.png',
            category: 'Editor',
            stackFileUrl: 'https://store.ethibox.io/packages/etherpad-0.1.0.tgz',
            orchestrator: 'kubernetes',
        },
    ];

    return res.json(appsFile);
});

export default app;
