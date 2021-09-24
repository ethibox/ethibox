import jwt from 'jsonwebtoken';
import isEmail from 'validator/lib/isEmail';
import Stripe from 'stripe';
import bcrypt from 'bcrypt';
import { generate } from 'generate-password';
import { invoiceList, upsertCustomer, upsertProduct, upsertPrice } from './stripe';
import {
    validStripe,
    getSettings,
    generateReleaseName,
    checkDnsRecord,
    getIp,
    sendWebhooks,
    updateTemplates,
    TOKEN_EXPIRATION,
    SECRET,
    STATES,
    EVENTS,
} from './utils';

export const registerMutation = async (_, { email, password }, ctx) => {
    if (!isEmail(email) || password.length < 6) {
        throw new Error('Email/password error');
    }

    if (await ctx.prisma.user.count({ where: { email } })) {
        throw new Error('User already exist');
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const isAdmin = !(await ctx.prisma.user.count());

    const user = await ctx.prisma.user.create({ data: { email, password: hashPassword, isAdmin } });

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin }, SECRET, { expiresIn: TOKEN_EXPIRATION });

    await sendWebhooks(EVENTS.REGISTER, { email, token }, ctx.prisma);

    return { token, user };
};

export const loginMutation = async (_, { email, password, remember }, ctx) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });

    if (!user || !user.enabled) {
        throw new Error('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, SECRET, { expiresIn: ((remember) ? TOKEN_EXPIRATION : '7d') });

    return { token, user };
};

export const resetMutation = async (_, { baseUrl, email }, ctx) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });

    if (!user) return null;

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '10m' });
    const link = `${baseUrl}/resetpassword?token=${token}`;

    await sendWebhooks(EVENTS.RESETPASSWORD, { email: user.email, token, link }, ctx.prisma);

    return true;
};

export const resetPasswordMutation = async (_, { token, password }, ctx) => {
    try {
        const decoded = jwt.verify(token, SECRET);
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await ctx.prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            throw new Error('Bad token');
        }

        await ctx.prisma.user.update({
            where: { id: user.id },
            data: { password: hashPassword },
        });

        return true;
    } catch (err) {
        throw new Error('Token expired');
    }
};

export const installApplicationMutation = async (_, data, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    let { templateId } = data;

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        const cardMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'card' }).catch(() => false);

        if (!cardMethod.data.length) {
            throw new Error('Method of payment required');
        }

        const { sessionId } = data;
        const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => false);

        if (session) {
            templateId = Number(session.metadata.template_id);
        }

        const { name: templateName } = await ctx.prisma.template.findUnique({ where: { id: templateId } });
        const releaseName = await generateReleaseName(templateName, ctx.prisma);
        await stripe.subscriptions.update(session.subscription, { metadata: { release_name: releaseName, application: 'ethibox' } });
    }

    const template = await ctx.prisma.template.findUnique({ where: { id: templateId } });

    if (!template) throw new Error('Not existing application');

    const rootDomain = (await getSettings('rootDomain', ctx.prisma)) || 'localhost';

    const releaseName = await generateReleaseName(template.name, ctx.prisma);

    const domain = `${releaseName}.${rootDomain}`;

    const application = await ctx.prisma.application.create({
        data: {
            releaseName,
            domain,
            user: { connect: { id: ctx.user.id } },
            template: { connect: { id: template.id } },
        },
    });

    if (template.envs) {
        for (const env of JSON.parse(template.envs)) {
            let { value } = env;

            if (env.name === 'ADMIN_EMAIL') {
                value = ctx.user.email;
            }

            if (env.name === 'ADMIN_PASSWORD') {
                value = generate({ length: 15, numbers: true });
            }

            await ctx.prisma.env.create({
                data: {
                    name: env.name,
                    value: env.type === 'select' ? env.select[0].value : value,
                    application: { connect: { id: application.id } },
                },
            });
        }
    }

    const envs = await ctx.prisma.env.findMany({
        where: { applicationId: application.id },
        select: { name: true, value: true },
    });

    await sendWebhooks(EVENTS.INSTALL, {
        releaseName,
        template,
        envs: JSON.stringify(envs.concat([{ name: 'DOMAIN', value: domain }, { name: 'NUMBER', value: `${application.id}` }])),
        user: ctx.user,
        token: jwt.sign({ ...ctx.user }, SECRET, { expiresIn: '7d' }),
    }, ctx.prisma);

    return true;
};

export const uninstallApplicationMutation = async (_, { releaseName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        const { data: subscriptions } = await stripe.subscriptions.list({ customer: ctx.user.id });

        const subscription = subscriptions.find((sub) => sub.metadata.release_name === releaseName);

        if (subscription) {
            await stripe.subscriptions.del(subscription.id, { prorate: false });
        }
    }

    const application = await ctx.prisma.application.update({
        where: { releaseName },
        data: {
            state: STATES.DELETED,
            user: { connect: { id: ctx.user.id } },
            lastTaskDate: new Date(),
        },
        include: { template: true },
    }).catch(() => false);

    await sendWebhooks(EVENTS.UNINSTALL, { application, user: ctx.user }, ctx.prisma);

    return true;
};

export const updateUserMutation = async (_, { firstName, lastName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    if (!firstName || !lastName) {
        throw new Error('Missing informations');
    }

    await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { firstName, lastName },
    });

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        await upsertCustomer(stripe, ctx.user.id, ctx.user.email, `${firstName} ${lastName}`);
    }

    return true;
};

export const updateSettingsMutation = async (_, { settings }, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    for (const setting of settings) {
        const { name, value } = setting;

        if (value === '************') {
            break;
        }

        await ctx.prisma.setting.upsert({
            where: { name },
            create: { name, value },
            update: { name, value },
        });
    }

    const { stripeEnabled, stripePublishableKey, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled && !(await validStripe(stripePublishableKey, stripeSecretKey))) {
        await ctx.prisma.setting.update({ where: { name: 'stripeEnabled' }, data: { value: 'false' } });
        throw new Error('Invalid stripe keys');
    }

    return true;
};

export const updateDefaultPaymentMethodMutation = async (_, { paymentMethodId }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeSecretKey } = await getSettings(null, ctx.prisma);

    const stripe = Stripe(stripeSecretKey);
    await stripe.customers.update(`${ctx.user.id}`, { invoice_settings: { default_payment_method: paymentMethodId } });

    return true;
};

export const removePaymentMethodMutation = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeSecretKey } = await getSettings(null, ctx.prisma);
    const stripe = Stripe(stripeSecretKey);

    const cardMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'card' }).catch(() => false);

    if (cardMethod && cardMethod.data.length) {
        const paymentMethodId = cardMethod.data[0].id;
        await stripe.paymentMethods.detach(paymentMethodId);
    }

    return true;
};

export const userQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.user.id } });

    if (!user) throw new Error('Not authorized');

    return user;
};

export const stripeQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeEnabled, stripePublishableKey, stripeSecretKey } = await getSettings(null, ctx.prisma);

    let data = { stripeEnabled, stripePublishableKey };

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);

        const cardMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'card' }).catch(() => false);

        if (cardMethod) {
            if (cardMethod.data.length) {
                const { last4 } = cardMethod.data[0].card;
                return { ...data, stripeLast4: last4, stripePaymentMethod: 'card' };
            }
        }

        await upsertCustomer(stripe, ctx.user.id, ctx.user.email);

        const intent = await stripe.setupIntents.create({ customer: ctx.user.id, payment_method_types: ['card'] }).catch(() => false);
        const stripeClientSecret = intent.client_secret;

        data = { ...data, stripeClientSecret, stripeLast4: '', stripePaymentMethod: '' };
    }

    return data;
};

export const settingsQuery = async (_, __, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    const settings = await ctx.prisma.setting.findMany();

    return settings;
};

export const applicationEnvsQuery = async (_, { releaseName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const application = await ctx.prisma.application.findUnique({ where: { releaseName }, include: { template: true, envs: true } });

    if (!application || application.userId !== ctx.user.id) {
        throw new Error('Not found');
    }

    const applicationEnvs = application.envs;

    const templateEnvs = application.template.envs ? JSON.parse(application.template.envs) : [];

    const envs = templateEnvs.filter((e) => e.preset !== true).map((env) => {
        const existingEnv = applicationEnvs.find((e) => e.name === env.name);

        if (existingEnv) {
            env.id = existingEnv.id;
            env.value = existingEnv.value;
        }

        return env;
    });

    return envs;
};

export const applicationsQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const applications = await ctx.prisma.application.findMany({ where: { userId: ctx.user.id, NOT: { state: STATES.DELETED } }, include: { template: true } });

    return applications.map((app) => ({ ...app, ...app.template }));
};

export const templatesQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const templates = await ctx.prisma.template.findMany({ where: { enabled: true } });

    return templates;
};

export const webhooksQuery = async (_, __, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    const webhooks = await ctx.prisma.webhook.findMany();

    return webhooks;
};

export const updateWebhooksMutation = async (_, { webhooks }, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    await ctx.prisma.webhook.deleteMany();

    for (const { event, targetUrl } of webhooks) {
        await ctx.prisma.webhook.create({ data: { event, targetUrl } });
    }

    return true;
};

export const updateTemplatesMutation = async (_, { templatesUrl }, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    await updateTemplates(templatesUrl, ctx.prisma);

    return true;
};

export const updateApplicationMutation = async (_, { releaseName, domain, envs }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const application = await ctx.prisma.application.findUnique({
        where: { releaseName },
        include: { template: true },
    });

    const rootDomain = (await getSettings('rootDomain', ctx.prisma)) || 'localhost';
    const ip = await getIp(rootDomain);

    if (!application || application.userId !== ctx.user.id) {
        throw new Error('Not authorized');
    }

    if (await ctx.prisma.application.count({ where: { domain } })) {
        if (domain !== application.domain) {
            throw new Error('Domain already exist');
        }
    }

    if (!(await checkDnsRecord(domain, ip))) {
        class DNSError extends Error {
            constructor(message) {
                super(message);
                this.name = 'DNSError';
                this.ip = ip;
            }
        }

        throw new DNSError('Please setup a correct DNS zone of type A for your domain {domain} with the ip {ip} on your registrar (ex: Gandi, OVH, Online, 1&1)');
    }

    const currentEnvs = await ctx.prisma.env.findMany({
        where: { applicationId: application.id },
        select: { name: true, value: true },
    });

    const templateEnvs = JSON.parse(application.template.envs);

    const newEnvs = [...new Map([...templateEnvs, ...currentEnvs, ...envs].map((item) => [item.name, item])).values()];

    await sendWebhooks(EVENTS.UPDATE, {
        releaseName,
        domain,
        envs: JSON.stringify(newEnvs.concat([{ name: 'DOMAIN', value: domain }, { name: 'NUMBER', value: `${application.id}` }])),
    }, ctx.prisma);

    await ctx.prisma.application.update({
        where: { releaseName },
        data: { domain, state: STATES.STANDBY, lastTaskDate: new Date() },
    });

    for (const { id, name, value } of envs) {
        await ctx.prisma.env.upsert({
            where: { id: id || 0 },
            create: { name, value },
            update: { name, value },
        });
    }

    return true;
};

export const applicationQuery = async (_, { releaseName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const application = await ctx.prisma.application.findUnique({ where: { releaseName } });

    if (!application || application.userId !== ctx.user.id) {
        throw new Error('Not found');
    }

    return application;
};

export const deleteAccountMutation = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const applications = await ctx.prisma.application.findMany({ where: { user: { id: ctx.user.id } } });

    for (const application of applications) {
        await ctx.prisma.application.update({
            where: { id: application.id },
            data: { state: STATES.DELETED, lastTaskDate: new Date() },
        });
    }

    await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { email: `deleted+${ctx.user.email}`, enabled: false },
    });

    await sendWebhooks(EVENTS.UNSUBSCRIBE, { user: ctx.user }, ctx.prisma);

    return true;
};

export const invoicesQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeSecretKey } = await getSettings(null, ctx.prisma);

    const stripe = Stripe(stripeSecretKey);

    const data = await invoiceList(stripe, ctx.user.id).catch(() => false);

    if (!data) return [];

    const invoices = data.map((invoice) => {
        invoice.url = invoice.hosted_invoice_url;
        invoice.date = new Date(invoice.created * 1000);
        return invoice;
    });

    return invoices;
};

export const createSessionCheckoutMutation = async (_, { templateId, baseUrl }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const template = await ctx.prisma.template.findUnique({ where: { id: templateId } });

    if (!template) throw new Error('No template found');

    const { logo, price, name, description, trial } = template;

    const { stripeSecretKey } = await getSettings(null, ctx.prisma);

    const stripe = Stripe(stripeSecretKey);

    const product = await upsertProduct(stripe, name, description, [logo]);

    await upsertCustomer(stripe, ctx.user.id, ctx.user.email);

    const { id: priceId } = await upsertPrice(stripe, product.id, price);

    const { url } = await stripe.checkout.sessions.create({
        success_url: `${baseUrl}apps?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: baseUrl,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        customer: ctx.user.id,
        customer_update: { name: 'auto' },
        locale: 'fr',
        mode: 'subscription',
        metadata: { template_id: templateId, application: 'ethibox' },
        ...(trial && { subscription_data: { trial_period_days: trial || 0 } }),
    });

    return url;
};
