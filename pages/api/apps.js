import 'dotenv/config';
import Stripe from 'stripe';
import fetch from 'node-fetch';
import { User, App, Env, Op } from '@lib/orm';
import {
    getCustomerNameFromPaymentMethods,
    getCustomerSubscriptions,
    deleteSubscription,
} from '@lib/stripe';
import {
    protectRoute,
    sendWebhook,
    generateReleaseName,
    checkDnsRecord,
    checkDomain,
    getDomainIp,
    decodeUnicode,
} from '@lib/utils';

/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
export const postQuery = async (req, res) => {
    const { sessionId } = req;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId).catch(() => false);
    const user = await User.findOne({ where: { id: stripeSession.customer }, raw: false });

    if (!user) return res.status(401).send({ message: 'Unauthorized' });

    if (!user.firstName || !user.lastName) {
        const name = await getCustomerNameFromPaymentMethods(stripeSession.customer);
        const [firstName, lastName] = name?.split(' ') || [];
        user.update({ firstName, lastName });
    }

    const { name } = stripeSession.metadata;
    const createdAt = new Date(stripeSession.created * 1000).toISOString();
    const releaseName = await generateReleaseName(name);

    if (stripeSession.subscription) {
        await stripe.subscriptions.update(stripeSession.subscription, { metadata: { releaseName } });
    }

    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());
    const domain = `${releaseName}.${process.env.ROOT_DOMAIN || 'localhost'}`;
    const template = templates.find((t) => t.title.toLowerCase() === name.toLowerCase());

    if (!template) return res.status(400).send({ message: 'Template not found' });

    const envs = template?.env || [];
    const { repository } = template;
    const { stackfile: stackFile, url: repositoryUrl } = repository;

    const alreadyExist = await App.findOne({ where: { [Op.or]: [{ releaseName }, { createdAt }] } });

    if (alreadyExist) return res.status(400).send({ message: 'App already exist' });

    const app = await App.create({ releaseName, domain, userId: user.id, createdAt });

    for await (const env of envs) {
        let { value } = env;

        if (env.name === 'ADMIN_EMAIL') {
            value = user.email;
        }

        if (env.name === 'ADMIN_PASSWORD') {
            value = Math.random().toString(36).slice(-8);
        }

        env.value = value;

        await Env.create({ name: env.name, value, appId: app.id });
    }

    Object.keys(process.env).forEach((key) => {
        const customEnvStartName = `CUSTOM_ENV_${name.toUpperCase().replace(/-/g, '_')}_`;

        if (key.startsWith('CUSTOM_ENV_ALL_') || key.startsWith(customEnvStartName)) {
            const envName = key.replace('CUSTOM_ENV_ALL_', '').replace(customEnvStartName, '');
            const envValue = decodeUnicode(process.env[key]);
            const env = envs.find((e) => e.name === envName);

            if (env) {
                env.value = envValue;
            } else {
                envs.push({ name: envName, value: envValue });
            }
        }
    });

    await sendWebhook({
        name,
        stackFile,
        repositoryUrl,
        ...app.dataValues,
        email: user.email,
        manual: template.manual,
        envs: JSON.stringify(
            envs.concat([
                { name: 'DOMAIN', value: domain },
                { name: 'NUMBER', value: `${app.id}` },
            ]),
        ),
        type: 'install-app',
    });

    return res.status(200).send({ success: true });
};

const getQuery = async (req, res, user) => {
    let apps = await user.getApps({ where: { [Op.not]: { state: 'deleted' } }, raw: false });
    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());

    apps = await Promise.all(apps.map(async (app) => {
        const template = templates.find((t) => t.title.toLowerCase() === app.name);

        let envs = (await app.getEnvs()).map((env) => ({
            ...env,
            ...(template?.env || []).find((e) => e.name === env.name),
        }));

        envs = envs.map((env) => ({
            ...env,
            select: (env.select || []).map((s) => ({ name: s.text, value: s.value || s.default })),
        })).filter((env) => !env.preset);

        envs = envs.filter((env) => template?.env?.find((e) => e.name === env.name));

        return {
            name: template.title,
            releaseName: app.releaseName,
            domain: app.domain,
            category: template.categories[0],
            logo: template?.logo,
            updatedAt: app.updatedAt,
            envs,
        };
    }));

    return res.status(200).send({ apps });
};

const putQuery = async (req, res, user) => {
    const { envs = [], domain, releaseName } = req;

    const apps = await user.getApps({ raw: false });
    const app = apps.find((a) => a.releaseName === releaseName);

    if (apps.find((a) => a.domain === domain && a.releaseName !== releaseName)) {
        return res.status(400).send({ message: 'Domain already exists' });
    }

    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());
    const template = templates.find((t) => t.title.toLowerCase() === app.name);
    const envNotFound = envs.some((env) => !((template?.env || []).find((e) => e.name === env.name)));

    if (envNotFound) {
        return res.status(400).send({ message: 'Envs are not valid' });
    }

    if (domain && domain !== app.domain) {
        const ip = await getDomainIp(process.env.ROOT_DOMAIN || 'localhost');
        const isValidDomain = await checkDnsRecord(domain, ip).catch(() => false);
        const isAuthorizedDomain = await checkDomain(domain);

        if (!isAuthorizedDomain) {
            return res.status(400).send({
                message: 'You are not authorized to use this domain',
            });
        }

        if (!isValidDomain) {
            return res.status(400).send({
                message: `Please setup a correct DNS zone of type A for your domain ${domain} with the ip ${ip} on your registrar (ex: Gandi, OVH, Online, 1&1)`,
            });
        }

        await app.update({ domain });
    }

    app.update({ state: 'standby' });
    app.changed('updatedAt', true);
    app.save();

    for await (const { name, value } of envs) {
        const [env] = await app.getEnvs({ where: { name }, raw: false });
        await env.update({ value }, { where: { name } });
    }

    const allEnvs = await app.getEnvs({ raw: true });

    const { repository } = template;
    const { stackfile: stackFile, url: repositoryUrl } = repository;

    Object.keys(process.env).forEach((key) => {
        const customEnvStartName = `CUSTOM_ENV_${app.name.toUpperCase().replace(/-/g, '_')}_`;

        if (key.startsWith('CUSTOM_ENV_ALL_') || key.startsWith(customEnvStartName)) {
            allEnvs.push({
                name: key.replace('CUSTOM_ENV_ALL_', '').replace(customEnvStartName, ''),
                value: decodeUnicode(process.env[key]),
            });
        }
    });

    await sendWebhook({
        stackFile,
        repositoryUrl,
        releaseName,
        domain,
        email: user.email,
        envs: JSON.stringify(
            allEnvs.concat([
                { name: 'DOMAIN', value: domain },
                { name: 'NUMBER', value: `${app.id}` },
            ]),
        ),
        type: 'update-app',
    });

    return res.status(200).send({ success: true });
};

const deleteQuery = async (req, res, user) => {
    const { releaseName } = req;

    const [app] = await user.getApps({ where: { releaseName }, raw: false });
    await app.update({ state: 'deleted' });
    const subscriptions = await getCustomerSubscriptions(user.id);

    for await (const subscription of subscriptions.filter((s) => s.metadata.releaseName === releaseName)) {
        await deleteSubscription(subscription.id);
    }

    await sendWebhook({
        releaseName,
        name: app.name,
        email: user.email,
        type: 'uninstall-app',
    });

    return res.status(200).send({ message: 'App deleted' });
};

export default protectRoute(async ({ body, method }, res, user) => {
    if (method === 'GET') return getQuery(body, res, user);
    if (method === 'POST') return postQuery(body, res, user);
    if (method === 'PUT') return putQuery(body, res, user);
    if (method === 'DELETE') return deleteQuery(body, res, user);

    return res.status(405).send({ message: 'Method not allowed' });
});
