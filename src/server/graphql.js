import path from 'path';
import fs from 'fs';
import express from 'express';
import jwt from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcrypt';
import graphqlHTTP from 'express-graphql';
import stripePackage from 'stripe';
import { makeExecutableSchema } from 'graphql-tools';
import { sequelize, Package, User, Settings, Application } from './models';
import { isAuthenticate, secret, publicIp, checkDnsRecord, synchronizeStore, STATES, ACTIONS } from './utils';

const app = express();
const tokenExpiration = '7d';

const resolvers = {
    Query: {
        applications: async (_, args, context) => {
            if (!context.req.user) return new Error('Not authorized');
            const { id } = context.req.user;

            const apps = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, package.icon icon, applications.ip ip
               FROM applications
               LEFT JOIN packages AS package ON applications.packageId = package.id
               INNER JOIN users AS user ON applications.userId = user.id AND user.id = ?`, { replacements: [id], type: sequelize.QueryTypes.SELECT });
            return apps;
        },
        user: async (_, __, context) => {
            if (!context.req.user) return new Error('Not authorized');
            return context.req.user;
        },
        settings: async (_, args, context) => {
            if (!context.req.user) return new Error('Not authorized');
            const settings = {};

            const data = await Settings.findAll({ attributes: ['name', 'value'], raw: true });
            data.forEach((param) => {
                settings[param.name] = (['0', '1'].includes(param.value)) ? param.value == true : param.value; // eslint-disable-line
            });

            return settings;
        },
        packages: async () => {
            const packages = await Package.findAll();
            return packages;
        },
    },
    Mutation: {
        installApplication: async (_, { name, releaseName }, context) => {
            try {
                if (!context.req.user) return new Error('Not authorized');
                if (context.req.isMonetizationEnabled && !context.req.user.isSubscribed) return new Error('Subscription is required');

                const pkg = await Package.findOne({ where: { name } });
                const { user } = context.req;

                const application = Application.build({ releaseName, state: STATES.INSTALLING, action: ACTIONS.INSTALL, user, package: pkg });
                application.setPackage(pkg, { save: false });
                application.setUser(user, { save: false });
                application.save();

                return { name };
            } catch ({ message }) {
                return new Error(message);
            }
        },
        uninstallApplication: async (_, { releaseName }, context) => {
            try {
                if (!context.req.user) return new Error('Not authorized');
                Application.update({ state: STATES.UNINSTALLING, action: ACTIONS.UNINSTALL }, { where: { releaseName } });

                return { releaseName };
            } catch ({ message }) {
                return new Error(message);
            }
        },
        editDomainNameApplication: async (_, { releaseName, domainName }, context) => {
            try {
                if (!context.req.user) return new Error('Not authorized');

                if (process.env.NODE_ENV === 'production' && !process.env.CI) {
                    const serverIp = await publicIp();
                    await checkDnsRecord(domainName, serverIp);
                }

                Application.update({ releaseName, domainName, action: ACTIONS.EDIT, state: STATES.EDITING }, { where: { releaseName } });

                return { releaseName };
            } catch ({ message }) {
                return new Error(message);
            }
        },
        subscribe: async (_, { stripeToken }, context) => {
            try {
                if (!context.req.user) return new Error('Not authorized');
                const { stripePlanName } = await Settings.find({ attributes: [['value', 'stripePlanName']], where: { name: 'stripePlanName' }, raw: true });
                const { stripeSecretKey } = await Settings.find({ attributes: [['value', 'stripeSecretKey']], where: { name: 'stripeSecretKey' }, raw: true });

                const stripe = stripePackage(stripeSecretKey);
                const { id, email } = context.req.user;
                let { stripeCustomerId } = context.req.user;

                if (!stripeCustomerId) {
                    const customer = await stripe.customers.create({ email });
                    stripeCustomerId = customer.id;
                    await User.update({ stripe_customer_id: stripeCustomerId }, { where: { id } });
                }

                await stripe.customers.createSource(stripeCustomerId, { source: stripeToken });

                const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId });

                if (!subscriptions.data.length) {
                    await stripe.subscriptions.create({ customer: stripeCustomerId, items: [{ plan: stripePlanName }] });
                    context.req.user.update({ isSubscribed: true });
                    return id;
                }

                return new Error('Unknown error');
            } catch ({ message }) {
                return new Error(message);
            }
        },
        unsubscribe: async (_, args, context) => {
            if (!context.req.user) return new Error('Not authorized');
            const { id } = context.req.user;
            await User.update({ isSubscribed: false }, { where: { id } });
            return id;
        },
        register: async (_, { email, password }, context) => {
            if (!isEmail(email) || password.length < 6) {
                throw new Error('Email/password error');
            }

            if (!await User.count({ where: { email } })) {
                const ip = context.req.headers['x-forwarded-for'] || context.req.connection.remoteAddress;
                const hashPassword = bcrypt.hashSync(password, 10);
                const user = await User.create({ ip, email, password: hashPassword, isAdmin: !await User.count() });
                const payload = { userId: user.dataValues.id };
                const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

                return { token };
            }

            throw new Error('User already exist');
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ where: { email }, raw: true });
            if (user && bcrypt.compareSync(password, user.password)) {
                const payload = { userId: user.id };
                const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });
                return { token };
            }

            throw new Error('Bad logins');
        },
        updatePassword: async (_, { password }, context) => {
            if (!context.req.user) return new Error('Not authorized');

            if (password.length < 6) {
                return new Error('Password too short');
            }

            const { id } = context.req.user;
            const hashPassword = bcrypt.hashSync(password, 10);
            await User.update({ password: hashPassword }, { where: { id } });
            return id;
        },
        updateAdminSettings: async (_, settings, context) => {
            if (!context.req.user.isAdmin) return new Error('Not authorized');

            try {
                if (!new RegExp(/^sk_/).test(settings.stripeSecretKey)) {
                    throw new Error('Invalid secret key');
                }

                if (!new RegExp(/^pk_/).test(settings.stripePublishableKey)) {
                    throw new Error('Invalid publishable key');
                }

                if (!new RegExp(/^plan_/).test(settings.stripePlanName)) {
                    throw new Error('Invalid plan name');
                }

                const stripe = await stripePackage(settings.stripeSecretKey);
                const plan = await stripe.plans.retrieve(settings.stripePlanName);
                const { amount, currency } = plan;
                settings.monthlyPrice = (currency === 'eur') ? `${amount / 100}€` : `$${amount / 100}`;
                await synchronizeStore(settings.storeRepositoryUrl);

                Object.entries(settings)
                    .map(([name, value]) => ({ name, value }))
                    .forEach(setting => Settings.update(setting, { where: { name: setting.name } }));
            } catch ({ message }) {
                return new Error(message);
            }

            return settings;
        },
    },
};

app.use('/', async (req, res, next) => {
    req.user = false;
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (isAuthenticate(token)) {
        const { userId } = jwtDecode(token);
        req.user = await User.findOne({ where: { id: userId } }) || false;
    }

    const { isMonetizationEnabled } = await Settings.findOne({
        attributes: [['value', 'isMonetizationEnabled']],
        where: { name: 'isMonetizationEnabled' },
        raw: true,
    }) || false;

    req.isMonetizationEnabled = (isMonetizationEnabled == true); // eslint-disable-line

    return next();
});

const publicPath = (process.env.NODE_ENV === 'production') ? '../src/server' : './';
const schemaFile = path.join(__dirname, publicPath, 'schema.graphql');
const typeDefs = fs.readFileSync(schemaFile, 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use('/', (req, res) => graphqlHTTP({
    schema,
    context: { req, res },
    graphiql: (process.env.NODE_ENV !== 'production'),
    formatError: err => err.message,
})(req, res));

export default app;
