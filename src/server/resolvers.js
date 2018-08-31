import stripePackage from 'stripe';
import jwt from 'jsonwebtoken';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcrypt';
import url from 'url';
import { sequelize, Package, User, Settings, Application } from './models';
import { secret, checkDnsRecord, synchronizeStore, STATES, ACTIONS } from './utils';
import { initOrchestrator, checkOrchestratorConnection } from './connector';

const tokenExpiration = '7d';

export const applicationsQuery = async (_, __, context) => {
    if (!context.req.user) return new Error('Not authorized');
    const { id } = context.req.user;
    const { orchestratorIp } = context.req.settings;

    const apps = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, package.icon icon
       FROM applications
       LEFT JOIN packages AS package ON applications.packageId = package.id
       INNER JOIN users AS user ON applications.userId = user.id AND user.id = ?`, { replacements: [id], type: sequelize.QueryTypes.SELECT });

    return apps.map(application => ({ ...application, ip: orchestratorIp }));
};

export const userQuery = async (_, __, context) => {
    if (!context.req.user) return new Error('Not authorized');
    return context.req.user;
};

export const settingsQuery = (_, __, context) => {
    if (!context.req.user) return new Error('Not authorized');
    const { settings } = context.req;

    settings.isOrchestratorConfigMissing = !(
        settings.orchestratorName &&
        settings.orchestratorEndpoint &&
        settings.orchestratorToken
    );

    if (!context.req.user.isAdmin) {
        return {
            isOrchestratorOnline: settings.isOrchestratorOnline,
            isOrchestratorConfigMissing: settings.isOrchestratorConfigMissing,
            isDemoEnabled: settings.isDemoEnabled,
            isMonetizationEnabled: settings.isMonetizationEnabled,
            stripePublishableKey: settings.stripePublishableKey,
            monthlyPrice: settings.monthlyPrice,
        };
    }

    return settings;
};

export const packagesQuery = async () => {
    const packages = await Package.findAll();
    return packages;
};

export const isFirstAccountQuery = async () => {
    const users = await User.count();
    return !users;
};

export const installApplicationMutation = async (_, { name, releaseName }, context) => {
    const { isMonetizationEnabled, isOrchestratorOnline } = context.req.settings;

    if (!context.req.user) throw new Error('Not authorized');
    if (isMonetizationEnabled && !context.req.user.isSubscribed) throw new Error('Subscription is required');
    if (!isOrchestratorOnline) throw new Error('Orchestrator connection failed!');

    const pkg = await Package.findOne({ where: { name } });
    const { user } = context.req;

    const application = Application.build({ releaseName, state: STATES.INSTALLING, action: ACTIONS.INSTALL, user, package: pkg });
    application.setPackage(pkg, { save: false });
    application.setUser(user, { save: false });
    application.save();

    return { name };
};

export const uninstallApplicationMutation = async (_, { releaseName }, context) => {
    if (!context.req.user) throw new Error('Not authorized');
    if (!context.req.settings.isOrchestratorOnline) throw new Error('Orchestrator connection failed!');

    const application = await Application.find({ where: { releaseName } });
    application.update({ state: STATES.UNINSTALLING, action: ACTIONS.UNINSTALL });

    return { releaseName };
};

export const editDomainNameApplicationMutation = async (_, { releaseName, domainName }, context) => {
    const { isOrchestratorOnline, orchestratorIp, checkDnsEnabled } = context.req.settings;

    if (!context.req.user) throw new Error('Not authorized');
    if (!isOrchestratorOnline) throw new Error('Orchestrator connection failed!');

    if (checkDnsEnabled) {
        if (!await checkDnsRecord(domainName, orchestratorIp)) {
            throw new Error(`DNS error, create a correct A record for your domain: ${domainName}. IN A ${orchestratorIp}.`);
        }
    }

    Application.update({ domainName, action: ACTIONS.EDIT, state: STATES.EDITING }, { where: { releaseName } });

    return { releaseName };
};

export const subscribeMutation = async (_, { stripeToken }, context) => {
    if (!context.req.user) throw new Error('Not authorized');
    const { stripePlanName, stripeSecretKey } = context.req.settings;

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
};

export const unsubscribeMutation = async (_, __, context) => {
    if (!context.req.user) return new Error('Not authorized');
    const { id } = context.req.user;
    await User.update({ isSubscribed: false }, { where: { id } });
    return id;
};

export const registerMutation = async (_, { email, password }, context) => {
    if (!isEmail(email) || password.length < 6) {
        throw new Error('Email/password error');
    }

    if (!await User.count({ where: { email } })) {
        const ip = context.req.headers['x-forwarded-for'] || context.req.connection.remoteAddress;
        const isAdmin = !await User.count();
        const hashPassword = bcrypt.hashSync(password, 10);
        const user = await User.create({ ip, email, password: hashPassword, isAdmin });
        const payload = { userId: user.dataValues.id };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });

        return { token, isAdmin };
    }

    throw new Error('User already exist');
};

export const loginMutation = async (_, { email, password }) => {
    const user = await User.findOne({ where: { email }, raw: true });
    if (user && bcrypt.compareSync(password, user.password)) {
        const payload = { userId: user.id };
        const token = jwt.sign(payload, secret, { expiresIn: tokenExpiration });
        return { token };
    }

    throw new Error('Bad logins');
};

export const updatePasswordMutation = async (_, { password }, context) => {
    if (!context.req.user) return new Error('Not authorized');

    if (password.length < 6) {
        return new Error('Password too short');
    }

    const { id } = context.req.user;
    const hashPassword = bcrypt.hashSync(password, 10);
    await User.update({ password: hashPassword }, { where: { id } });
    return id;
};

export const updateAdminSettingsMutation = async (_, { settings }, context) => {
    if (!context.req.user.isAdmin) throw new Error('Not authorized');

    const { disableOrchestratorCheck } = context.req.settings;
    const { isMonetizationEnabled, orchestratorEndpoint, orchestratorToken, storeRepositoryUrl } = settings;

    if (isMonetizationEnabled) {
        if (!new RegExp(/^sk_/).test(settings.stripeSecretKey)) {
            throw new Error('Invalid secret key');
        }

        if (!new RegExp(/^pk_/).test(settings.stripePublishableKey)) {
            throw new Error('Invalid publishable key');
        }

        const stripe = await stripePackage(settings.stripeSecretKey);
        const plan = await stripe.plans.retrieve(settings.stripePlanName);
        const { amount, currency } = plan;
        settings.monthlyPrice = (currency === 'eur') ? `${amount / 100}€` : `$${amount / 100}`;
    }

    if (storeRepositoryUrl) {
        await synchronizeStore(storeRepositoryUrl);
    }

    if (orchestratorEndpoint && orchestratorToken) {
        settings.orchestratorIp = url.parse(orchestratorEndpoint).hostname;

        if (disableOrchestratorCheck) {
            settings.isOrchestratorOnline = true;
        } else {
            settings.isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
            if (settings.isOrchestratorOnline) {
                await initOrchestrator(orchestratorEndpoint, orchestratorToken);
            }
        }

        if (!settings.isOrchestratorOnline) {
            throw new Error('Orchestrator connection failed!');
        }
    }

    Object.entries(settings)
        .map(([name, value]) => ({ name, value }))
        .forEach(setting => Settings.update(setting, { where: { name: setting.name } }));

    return settings;
};
