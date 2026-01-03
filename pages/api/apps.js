import { STATE, WEBHOOK_EVENTS, NEXT_PUBLIC_BASE_PATH, TEMPLATES_URL } from '../../lib/constants';
import { App, User, Env, Op } from '../../lib/orm';
import { deploy, remove } from '../../lib/docker';
import {
    getDomainIp,
    isValidDomain,
    getCustomEnvs,
    triggerWebhook,
    fetchTemplates,
    useTranslation,
    generatePassword,
    generateReleaseName,
} from '../../lib/utils';
import {
    getStripeSubscriptions,
    createStripeCheckoutUrl,
    cancelStripeSubscription,
} from '../../lib/stripe';

const getQuery = async (_, res, user) => {
    const templates = await fetchTemplates(false);

    const apps = (await App.findAll({ where: { userId: user.id, state: { [Op.ne]: STATE.DELETED } }, include: Env })).map((app) => {
        const template = templates.find((t) => t.name.toLowerCase() === app.name);
        const { name = 'Unknown', logo = `${NEXT_PUBLIC_BASE_PATH}/logo.svg`, category = 'Unknown' } = template || {};

        const envs = template?.env?.filter((env) => !env.preset).map((env) => ({
            ...env,
            ...(env.select && { select: env.select.map((s) => ({ name: s.text, value: s.value || s.default })) }),
        }));

        app.envs.forEach((env) => {
            const existingEnv = envs?.find((e) => e.name === env.name);
            if (existingEnv) existingEnv.value = env.value;
        });

        const data = { ...app.dataValues };

        delete data.id;
        delete data.userId;

        return { ...data, name, logo, category, envs: envs || [] };
    });

    return res.status(200).json({ apps });
};

// eslint-disable-next-line complexity
const postQuery = async (req, res, user) => {
    const { name, returnUrl } = req.body || {};

    const releaseName = await generateReleaseName(name);

    const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
    const domain = `${releaseName}.${rootDomain}`;

    const templates = await fetchTemplates();
    const template = templates.find((t) => t.name.toLowerCase() === name.toLowerCase());

    const locale = req?.headers?.['accept-language'];
    const t = useTranslation(locale);

    if (!template) return res.status(400).send({ message: t('template_not_found') });

    if (process.env.STRIPE_SECRET_KEY) {
        const subscriptions = await getStripeSubscriptions(user);
        const existingSubscription = subscriptions.find((s) => s.metadata.releaseName === releaseName);

        if (!existingSubscription) {
            const url = await createStripeCheckoutUrl({ name, releaseName }, user, returnUrl, locale);

            return res.status(201).json({ ok: true, url });
        }
    }

    const app = await App.create({
        domain,
        releaseName,
        userId: user.id,
        commit: template.commit,
        state: template.manual ? STATE.WAITING : STATE.STANDBY,
    });

    const envs = (template?.env || []).concat(getCustomEnvs(name));

    for await (const env of envs) {
        const { select } = env;

        if (env.name === 'ADMIN_EMAIL') {
            env.value = user.email;
        }

        if (env.name === 'ADMIN_PASSWORD') {
            env.value = generatePassword();
        }

        if (env.type === 'select') {
            env.value = select[0].value;
        }

        if (env.value) {
            await Env.create({ name: env.name, value: env.value, appId: app.id });
        }
    }

    const payload = ({
        name: template.name,
        releaseName: app.releaseName,
        domain: app.domain,
        email: user.email,
        manual: template.manual,
        envs: JSON.stringify(
            envs.concat([
                { name: 'DOMAIN', value: domain },
                { name: 'NUMBER', value: `${app.id}` },
            ]).map((e) => ({ name: e.name, value: e.value })),
        ),
        ...template,
    });

    if (app.state === STATE.WAITING) {
        payload.stackfile = TEMPLATES_URL.replace('templates.json', 'stacks/waiting.yml');
    }

    await deploy(payload.stackfile, payload.releaseName, JSON.parse(payload.envs));

    await triggerWebhook(WEBHOOK_EVENTS.APP_INSTALLED, payload);

    return res.status(201).json({ ok: true, url: '/apps?installed=true' });
};

// eslint-disable-next-line complexity
const putQuery = async (req, res, user) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { releaseName, domain, envs } = req.body || {};

    const app = await App.findOne({ where: { releaseName, userId: user.id } });

    if (!app) return res.status(404).json({ message: t('app_not_found') });

    if (await App.findOne({ where: { domain, releaseName: { [Op.ne]: releaseName } } })) {
        return res.status(400).send({ message: t('domain_already_exists') });
    }

    const ip = await getDomainIp(process.env.ROOT_DOMAIN || 'localhost');

    if (domain !== app.domain && domain !== `${releaseName}.${process.env.ROOT_DOMAIN || 'localhost'}`) {
        try {
            await isValidDomain(domain, ip);
        } catch ({ message }) {
            return res.status(400).json({ message: t(message, { domain, ip }) });
        }
    }

    const templates = await fetchTemplates(false);
    const template = templates.find(({ name }) => name.toLowerCase() === app.name.toLowerCase());
    const allowedEnvs = (envs || []).filter(({ name }) => (template?.env || []).some((e) => e.name === name && !e.disabled));

    for await (const { name, value } of allowedEnvs.concat(getCustomEnvs(app.name))) {
        const existingEnv = await Env.findOne({ where: { name, appId: app.id } });

        if (existingEnv) {
            await existingEnv.update({ value });
        } else {
            await Env.create({ name, value, appId: app.id });
        }
    }

    await app.update({ domain, state: app.state === STATE.WAITING ? app.state : STATE.STANDBY });

    const newEnvs = await app.getEnvs();

    const payload = ({
        releaseName: app.releaseName,
        domain: app.domain,
        email: user.email,
        envs: JSON.stringify(
            newEnvs.concat([
                { name: 'DOMAIN', value: domain },
                { name: 'NUMBER', value: `${app.id}` },
            ]).map(({ name, value }) => ({ name, value })),
        ),
        ...template,
    });

    if (app.state === STATE.WAITING) {
        payload.stackfile = TEMPLATES_URL.replace('templates.json', 'stacks/waiting.yml');
    }

    await deploy(payload.stackfile, payload.releaseName, JSON.parse(payload.envs));

    await triggerWebhook(WEBHOOK_EVENTS.APP_UPDATED, payload);

    return res.status(200).json({ ok: true });
};

const deleteQuery = async (req, res, user) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { releaseName } = req.body || {};

    const app = await App.findOne({ where: { releaseName, userId: user.id } });

    if (!app) {
        return res.status(404).json({ message: t('app_not_found') });
    }

    await app.update({ state: STATE.DELETED });

    if (process.env.STRIPE_SECRET_KEY) {
        await cancelStripeSubscription(user, { releaseName });
    }

    await remove(app.releaseName);

    await triggerWebhook(WEBHOOK_EVENTS.APP_UNINSTALLED, {
        name: app.name,
        domain: app.domain,
        email: user.email,
        releaseName: app.releaseName,
    });

    return res.status(200).json({ ok: true });
};

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const email = req.headers['x-user-email'];
    const user = await User.findOne({ where: { email }, raw: true }).catch(() => false);

    if (!user) {
        res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
        return res.status(401).json({ message: t('unauthorized') });
    }

    if (req.method === 'GET') return getQuery(req, res, user);
    if (req.method === 'POST') return postQuery(req, res, user);
    if (req.method === 'PUT') return putQuery(req, res, user);
    if (req.method === 'DELETE') return deleteQuery(req, res, user);

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: t('method_not_allowed') });
};
