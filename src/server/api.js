import express from 'express';
import jwt from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcrypt';
import { checkConfig, listApplications, installApplication, uninstallApplication, listCharts, stateApplication, portApplication } from './k8sClient';
import { User } from './models';
import { isAuthenticate, secret } from './utils';

const api = express();
const tokenExpiration = '7d';

api.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!isEmail(email) || password.length < 6) {
        return res.json({ success: false, message: 'Email/password error' });
    }

    if (!await User.count({ where: { email } })) {
        const hashPassword = bcrypt.hashSync(password, 10);
        User.sync().then(() => User.create({ ip, email, password: hashPassword }));
        const payload = { email };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

        return res.json({ success: true, message: 'Register succeeded', token });
    }

    return res.status(409).send({ success: false, message: 'User already exist' });
});

api.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }, raw: true });
    if (user && bcrypt.compareSync(password, user.password)) {
        const payload = { email };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

        return res.json({ success: true, message: 'Login succeeded', token });
    }

    return res.status(401).send({ success: false, message: 'Bad credentials' });
});

api.use((req, res, next) => {
    req.jwt_auth = false;
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (isAuthenticate(token)) {
        req.jwt_auth = true;
    }

    next();
});

api.get('/applications', async (req, res) => {
    if (!req.jwt_auth) return res.status(401).send({ success: false, message: 'Not authorized' });

    try {
        const apps = await listApplications();
        return res.json(apps);
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.post('/applications', async (req, res) => {
    if (!req.jwt_auth) return res.status(401).send({ success: false, message: 'Not authorized' });

    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    const { email } = jwtDecode(token);

    try {
        const { name, releaseName } = req.body;
        await installApplication(name, email, releaseName);
        return res.json({ success: true, message: 'Application installed' });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.delete('/applications/:releaseName', (req, res) => {
    if (!req.jwt_auth) return res.status(401).send({ success: false, message: 'Not authorized' });

    try {
        const { releaseName } = req.params;
        uninstallApplication(releaseName);
        return res.json({ success: true, message: 'Application uninstalled' });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.get('/applications/:releaseName', async (req, res) => {
    if (!req.jwt_auth) return res.status(401).send({ success: false, message: 'Not authorized' });

    try {
        checkConfig();
        const { releaseName } = req.params;
        const state = await stateApplication(releaseName);

        if (state === 'notexisting') {
            return res.status(404).send({ success: false, message: 'Application not exist' });
        }

        const port = await portApplication(releaseName);
        return res.json({ releaseName, state, port });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.get('/charts', (req, res) => {
    if (!req.jwt_auth) return res.status(401).send({ success: false, message: 'Not authorized' });

    try {
        const charts = listCharts();
        return res.json(charts);
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

export default api;
