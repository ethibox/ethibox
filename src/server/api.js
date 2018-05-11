import dns from 'dns';
import express from 'express';
import jwt from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcrypt';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import { sequelize, Package, User, Application } from './models';
import { isAuthenticate, secret, externalIp, STATES, ACTIONS } from './utils';

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
        const payload = { email, demo: process.env.ENABLE_DEMO };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

        return res.json({ success: true, message: 'Register succeeded', token });
    }

    return res.status(409).send({ success: false, message: 'User already exist' });
});

api.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }, raw: true });
    if (user && bcrypt.compareSync(password, user.password)) {
        const payload = { email, demo: process.env.ENABLE_DEMO };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

        return res.json({ success: true, message: 'Login succeeded', token });
    }

    return res.status(401).send({ success: false, message: 'Bad credentials' });
});

api.use(async (req, res, next) => {
    req.jwt_auth = false;
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token && isAuthenticate(token)) {
        req.jwt_auth = true;
        const { email } = jwtDecode(token);
        req.body.user = await User.findOne({ where: { email } }) || false;
    }

    if (!token || !req.body.user) {
        return res.status(401).send({ success: false, message: 'Not authorized' });
    }

    return next();
});

api.post('/applications', async (req, res) => {
    try {
        const { name, releaseName, user } = req.body;
        const pkg = await Package.findOne({ where: { name } });

        Application.create({ releaseName, state: STATES.INSTALLING, action: ACTIONS.INSTALL, user, package: pkg }).then((application) => {
            user.addApplication(application);
            pkg.addApplication(application);
        });

        return res.json({ success: true, message: 'Application installing' });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.delete('/applications/:releaseName', async (req, res) => {
    try {
        const { releaseName } = req.params;
        Application.update({ state: STATES.UNINSTALLING, action: ACTIONS.UNINSTALL }, { where: { releaseName } });

        return res.json({ success: true, message: 'Application uninstalling' });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

api.put('/applications/:releaseName', async (req, res) => {
    const { releaseName } = req.params;
    const { domainName } = req.body;

    try {
        if (domainName) {
            const serverIp = await externalIp();
            const domainNameIp = await new Promise((resolve, reject) => {
                dns.lookup(domainName, (error, address) => {
                    if (error) {
                        return reject(new Error('DNS error, domain does not exist'));
                    }
                    return resolve(address);
                });
            });

            if (process.env.NODE_ENV === 'production' && serverIp !== domainNameIp) {
                return res.status(500).send({ success: false, message: `DNS error, create a correct A record for your domain: ${domainName}. IN A ${serverIp}.` });
            }
        }

        Application.update({ releaseName, domainName, action: ACTIONS.EDIT, state: STATES.EDITING }, { where: { releaseName } });
        return res.json({ success: true, message: 'Application edited' });
    } catch ({ message }) {
        return res.status(500).send({ success: false, message });
    }
});

const schema = buildSchema(`
  type Query {
    packages: [Package]
    applications(email: String!): [Application]
  }

  type Package {
    name: String
    icon: String
    category: String
    description: String
    version: String
  }

  type Application {
    name: String
    category: String
    releaseName: String
    domainName: String
    state: String
    ip: String
    port: Int
    error: String
  }
`);

const rootValue = {
    applications: async ({ email }) => {
        const apps = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, applications.ip as ip
           FROM applications
           LEFT JOIN packages AS package ON applications.packageId = package.id
           INNER JOIN users AS user ON applications.userId = user.id AND user.email = ?`, { replacements: [email], type: sequelize.QueryTypes.SELECT });
        return apps;
    },
    packages: async () => {
        const packages = await Package.findAll();
        return packages;
    },
};

api.use('/graphql', (req, res) => graphqlHTTP({
    schema,
    rootValue,
    context: { req, res },
    graphiql: (process.env.NODE_ENV !== 'production'),
})(req, res));

export default api;
