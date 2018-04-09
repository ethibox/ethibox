import express from 'express';
import bcrypt from 'bcrypt';
import { sequelize, Package, Application, User, Settings } from './models';

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

app.get('/reset', async (req, res) => {
    User.destroy({ force: true, truncate: true, cascade: true });
    sequelize.query('UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME="users";');

    Application.destroy({ force: true, truncate: true, cascade: true });
    sequelize.query('UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME="applications";');

    Package.destroy({ force: true, truncate: true, cascade: true });
    sequelize.query('UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME="packages";');

    Settings.destroy({ force: true, truncate: true, cascade: true });
    sequelize.query('UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME="settings";');
    return res.send('ok');
});

app.delete('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    Application.destroy({ where: { releaseName } });
    return res.send('ok');
});

app.put('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    const { state } = req.body;
    Application.update({ state }, { where: { releaseName } });
    return res.send('ok');
});

export default app;
