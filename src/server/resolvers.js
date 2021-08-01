import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import isEmail from 'validator/lib/isEmail';
import Stripe from 'stripe';
import bcrypt from 'bcrypt';
import { generate } from 'generate-password';
import MatomoTracker from 'matomo-tracker';
import { invoiceList, upgradeSubscription, downgradeSubscription, upsertCustomer } from './stripe';
import {
    validStripe,
    secret,
    tokenExpiration,
    asyncForEach,
    getSettings,
    generateReleaseName,
    checkDnsRecord,
    fileToJson,
    getIp,
    sendWebhooks,
    TASKS,
    STATES,
    EVENTS,
} from './utils';

export const registerMutation = async (_, { email, password }, ctx) => {
    if (!isEmail(email) || password.length < 6) {
        throw new Error('Email/password error');
    }

    const hashPassword = await bcrypt.hash(password, 10);

    if (await ctx.prisma.user.count({ where: { email } })) {
        throw new Error('User already exist');
    }

    const isAdmin = !(await ctx.prisma.user.count());

    const user = await ctx.prisma.user.create({ data: { email, password: hashPassword, isAdmin } });

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        await upsertCustomer(stripe, user.id, email);
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin }, secret, { expiresIn: tokenExpiration });

    return {
        token,
        user,
    };
};

export const loginMutation = async (_, { email, password, remember }, ctx) => {
    const user = await ctx.prisma.user.findOne({ where: { email } });

    if (!user || !user.enabled) {
        throw new Error('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, secret, { expiresIn: ((remember) ? tokenExpiration : '7d') });

    return {
        token,
        user,
    };
};

export const resetMutation = async (_, { email }, ctx) => {
    const user = await ctx.prisma.user.findOne({ where: { email } });

    if (!user) {
        return null;
    }

    const transporter = nodemailer.createTransport({
        port: process.env.MAIL_PORT || 587,
        host: process.env.MAIL_HOST || 'mail.ethibox.fr',
        tls: process.env.MAIL_TLS || true,
        auth: {
            user: process.env.MAIL_USER || 'noreply@ethibox.fr',
            pass: process.env.MAIL_PASS,
        },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '10m' });
    const link = `https://ethibox.fr/app/resetpassword?token=${token}`;

    const { html } = mjml2html(`
    <mjml>
        <mj-body>
            <mj-section>
                <mj-column>
                    <mj-text>Hello,</mj-text>
                    <mj-text>A reset password procedure for your account ${email} has been requested.</mj-text>
                    <mj-text>Please follow this link to reset it:</mj-text>
                    <mj-button href="${link}" align="left">Reset my password</mj-button>
                    <mj-text>(the link will expire within 1 hour)</mj-text>
                    <mj-text>If you are not the person who initiated this request, please ignore this email.</mj-text>
                    <mj-text>Ethibox</mj-text>
                </mj-column>
            </mj-section>
        </mj-body>
    </mjml>
    `);

    const mailOptions = {
        from: process.env.MAIL_FROM || 'noreply@ethibox.fr',
        subject: process.env.MAIL_SUBJECT || 'Reset your password',
        html,
    };

    console.info(link);

    transporter.sendMail({ ...mailOptions, to: email }).catch(({ message }) => {
        console.error(message);

        if (process.env.NODE_ENV === 'production') {
            throw new Error('Internal Server Error');
        }
    });

    return true;
};

export const resetPasswordMutation = async (_, { token, password }, ctx) => {
    try {
        const decoded = jwt.verify(token, secret);
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await ctx.prisma.user.findOne({ where: { id: decoded.id } });

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

export const installApplicationMutation = async (_, { templateId }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const template = await ctx.prisma.template.findOne({ where: { id: templateId } });

    if (!template) throw new Error('Not existing application');

    const appsUserLimit = await getSettings('appsUserLimit', ctx.prisma);

    const userApps = await ctx.prisma.application.count({ where: { userId: ctx.user.id, NOT: { state: STATES.DELETED } } });

    if (appsUserLimit && userApps >= appsUserLimit) {
        throw new Error('Your apps number limit is exceeded');
    }

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled) {
        const stripe = Stripe(stripeSecretKey);
        const cardMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'card' }).catch(() => false);
        const ibanMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'sepa_debit' }).catch(() => false);

        if (!cardMethod.data.length && !ibanMethod.data.length) {
            throw new Error('Method of payment required');
        }
    }

    const rootDomain = (await getSettings('rootDomain', ctx.prisma)) || 'local.ethibox.fr';

    const releaseName = await generateReleaseName(template.name, ctx.prisma);

    const domain = `${releaseName}.${rootDomain}`;

    const application = await ctx.prisma.application.create({
        data: {
            price: template.price,
            releaseName,
            domain,
            user: { connect: { id: ctx.user.id } },
            template: { connect: { id: template.id } },
        },
    });

    if (template.envs) {
        await asyncForEach(JSON.parse(template.envs), async (env) => {
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
        });
    }

    return true;
};

export const uninstallApplicationMutation = async (_, { releaseName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    await ctx.prisma.application.update({
        where: { releaseName },
        data: {
            task: TASKS.UNINSTALL,
            state: STATES.UNINSTALLING,
            lastTaskDate: new Date(),
            user: { connect: { id: ctx.user.id } },
        },
    }).catch(() => false);

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

    await asyncForEach(settings, async (setting) => {
        const { name, value } = setting;

        if (value === '************') {
            return;
        }

        await ctx.prisma.setting.upsert({
            where: { name },
            create: { name, value },
            update: { name, value },
        });
    });

    const { stripeEnabled, stripePublishableKey, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (stripeEnabled && !(await validStripe(stripePublishableKey, stripeSecretKey))) {
        await ctx.prisma.setting.update({ where: { name: 'stripeEnabled' }, data: { value: 'false' } });
        throw new Error('Invalid stripe keys');
    }

    return true;
};

export const updateGlobalEnvsMutation = async (_, { globalEnvs }, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    await ctx.prisma.env.deleteMany({ where: { global: true } });

    for (const { name, value } of globalEnvs) {
        await ctx.prisma.env.create({ data: { name, value, global: true } });
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
    const ibanMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'sepa_debit' }).catch(() => false);

    if (cardMethod && cardMethod.data.length) {
        const paymentMethodId = cardMethod.data[0].id;
        await stripe.paymentMethods.detach(paymentMethodId);
    }

    if (ibanMethod && ibanMethod.data.length) {
        const paymentMethodId = ibanMethod.data[0].id;
        await stripe.paymentMethods.detach(paymentMethodId);
    }

    return true;
};

export const userQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const user = await ctx.prisma.user.findOne({ where: { id: ctx.user.id } });

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
        const ibanMethod = await stripe.paymentMethods.list({ customer: ctx.user.id, type: 'sepa_debit' }).catch(() => false);

        if (cardMethod || ibanMethod) {
            if (cardMethod.data.length) {
                const { last4 } = cardMethod.data[0].card;
                return { ...data, stripeLast4: last4, stripePaymentMethod: 'card' };
            }

            if (ibanMethod.data.length) {
                const { last4 } = ibanMethod.data[0].sepa_debit;
                return { ...data, stripeLast4: last4, stripePaymentMethod: 'iban' };
            }
        }

        const intent = await stripe.setupIntents.create({ customer: ctx.user.id, payment_method_types: ['card', 'sepa_debit'] }).catch(() => false);
        const stripeClientSecret = intent.client_secret;

        data = { ...data, stripeClientSecret, stripeLast4: '', stripePaymentMethod: '' };
    }

    return data;
};

export const settingsQuery = async (_, __, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    const settings = await ctx.prisma.setting.findMany();

    return settings.filter(({ name }) => name !== 'portainerToken').map((setting) => {
        if (setting.name === 'portainerPassword') {
            return { ...setting, value: '************' };
        }

        return setting;
    });
};

export const globalEnvsQuery = async (_, __, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    const envs = await ctx.prisma.env.findMany({ where: { global: true } });

    return envs;
};

export const applicationEnvsQuery = async (_, { releaseName }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const application = await ctx.prisma.application.findOne({ where: { releaseName }, include: { template: true, envs: true } });

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

export const upgradeStripeSubscriptionMutation = async (_, { appId, price }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (!stripeEnabled) {
        throw new Error('Stripe is not enabled');
    }

    const application = await ctx.prisma.application.findOne({ where: { id: appId }, include: { template: true } });

    if (!application) {
        throw new Error('No application found');
    }

    const appName = application.template.name;
    const stripe = Stripe(stripeSecretKey);
    await upgradeSubscription(stripe, ctx.user.id, appName, price, appId);

    if (process.env.MATOMO_ENABLED) {
        const matomo = new MatomoTracker(process.env.MATOMO_SITEID, `${process.env.MATOMO_URL}/matomo.php`);
        matomo.track({
            url: '/paid',
            e_c: 'app',
            e_a: 'paid',
            uid: ctx.user.email,
        });
    }

    return true;
};

export const downgradeStripeSubscriptionMutation = async (_, { appId }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeEnabled, stripeSecretKey } = await getSettings(null, ctx.prisma);

    if (!stripeEnabled) {
        throw new Error('Stripe is not enabled');
    }

    const stripe = Stripe(stripeSecretKey);
    await downgradeSubscription(stripe, ctx.user.id, appId);

    return true;
};

export const uploadTemplatesMutation = async (_, { file }, ctx) => {
    if (!ctx.user || !ctx.user.isAdmin) throw new Error('Not authorized');

    const { createReadStream, mimetype } = await file;

    if (mimetype !== 'application/json') {
        throw new Error('Not a valid json file');
    }

    const templates = await fileToJson(createReadStream);

    if (!templates.length) {
        throw new Error('Not a valid json file');
    }

    const existingTemplates = await ctx.prisma.template.findMany();

    await asyncForEach(existingTemplates, async ({ id, name }) => {
        const existingTemplate = templates.find((t) => t.name === name);

        if (!existingTemplate) {
            await ctx.prisma.template.update({ where: { id }, data: { enabled: false } });
        }
    });

    await asyncForEach(templates.filter((t) => t.enabled), async (template) => {
        const { name, description, category, logo, website, auto, repositoryUrl, stackFile, price, trial, adminPath, envs } = template;

        await ctx.prisma.template.upsert({
            where: { name },
            create: { name, description, category, logo, website, auto, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
            update: { name, description, category, logo, website, auto, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
        });
    });

    return true;
};

export const updateAppMutation = async (_, { releaseName, domain, envs }, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const application = await ctx.prisma.application.findOne({ where: { releaseName } });
    const rootDomain = (await getSettings('rootDomain', ctx.prisma)) || 'local.ethibox.fr';
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

    await sendWebhooks(EVENTS.UPDATE, { releaseName, domain, envs }, ctx.prisma);

    await ctx.prisma.application.update({
        where: { releaseName },
        data: { domain },
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

    const application = await ctx.prisma.application.findOne({ where: { releaseName } });

    if (!application || application.userId !== ctx.user.id) {
        throw new Error('Not found');
    }

    return application;
};

export const summaryQuery = async (_, __, ctx) => {
    const applications = await ctx.prisma.application.findMany({ where: { NOT: { price: 0 } } });
    const templates = await ctx.prisma.template.findMany();

    const prices = templates.reduce((a, b) => a + b.price, 0);
    const priceAvg = Math.floor(prices / templates.length);

    const total = applications.filter((app) => app.state !== STATES.DELETED).reduce((a, b) => a + b.price, 0);

    return {
        templates,
        applications: applications.length,
        priceAvg,
        total,
    };
};

export const deleteAccountMutation = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const applications = await ctx.prisma.application.findMany({ where: { user: { id: ctx.user.id } } });

    for (const application of applications) {
        await ctx.prisma.application.update({
            where: { id: application.id },
            data: {
                task: TASKS.UNINSTALL,
                state: STATES.UNINSTALLING,
                lastTaskDate: new Date(),
            },
        });
    }

    await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { email: `deleted+${ctx.user.email}`, enabled: false },
    });

    return true;
};

export const invoicesQuery = async (_, __, ctx) => {
    if (!ctx.user) throw new Error('Not authorized');

    const { stripeSecretKey } = await getSettings(null, ctx.prisma);

    const stripe = Stripe(stripeSecretKey);

    const data = await invoiceList(stripe, ctx.user.id);

    const invoices = data.map((invoice) => {
        invoice.url = invoice.hosted_invoice_url;
        invoice.date = new Date(invoice.created * 1000);
        return invoice;
    });

    return invoices;
};
