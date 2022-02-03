import 'isomorphic-fetch';
import dns from 'dns';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const SECRET = process.env.SECRET || crypto.randomBytes(32).toString('hex');
export const TEMPLATES_URL = process.env.TEMPLATES_URL || 'https://raw.githubusercontent.com/ethibox/awesome-stacks/master/templates.json';
export const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
export const STRIPE_ENABLED = process.env.STRIPE_ENABLED || 'false';
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '30d';

export const checkStatus = (response) => new Promise((resolve, reject) => {
    if (response.status !== 200) {
        return reject(new Error(response.statusText));
    }

    return response.json().then((res) => {
        if (res.errors) {
            reject(new Error(res.errors[0]));
        }

        resolve(res);
    });
});

export const isAuth = (token) => {
    try {
        const { exp } = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);

        if (now < exp) {
            return true;
        }

        return false;
    } catch (e) {
        return false;
    }
};

export const timeout = (ms, promise) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error('timeout'));
    }, ms);
    promise.then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
    }, (err) => {
        clearTimeout(timeoutId);
        reject(err);
    });
});

export const checkUrl = (url, retry = 1) => new Promise((resolve) => {
    timeout(10000, fetch(url, { redirect: 'follow' })).then(({ status }) => {
        if (status === 200) {
            resolve(true);
        } else {
            resolve(false);
        }
    }).catch((e) => {
        if (e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || e.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
            resolve(false);
        }

        resolve(false);
    });
}).then(async (response) => {
    if (retry >= 3) return false;

    if (!response) {
        const newCheck = await checkUrl(url, retry + 1);
        return newCheck;
    }

    return true;
});

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isValidToken = (token) => {
    try {
        if (token) {
            return jwt.verify(token, SECRET);
        }

        return false;
    } catch (err) {
        return false;
    }
};

export const decodeToken = (token) => jwt.decode(token);

export const isNumber = (value) => !Number.isNaN(Number(value));

export const getSettings = async (name, prisma) => {
    const settings = await prisma.setting.findMany();

    if (name) {
        const setting = settings.find((s) => s.name === name);
        return setting ? setting.value : '';
    }

    const data = {};

    settings.forEach((setting) => {
        if (isNumber(setting.value)) setting.value = Number(setting.value);
        if (setting.value === 'true') setting.value = true;
        if (setting.value === 'false') setting.value = false;

        data[setting.name] = setting.value;
    });

    return data;
};

export const checkDnsRecord = (domain, ip) => new Promise((resolve) => dns.lookup(domain, (error, address) => {
    if (ip === address) {
        resolve(true);
    }

    resolve(false);
}));

export const getIp = (domain) => new Promise((resolve) => dns.lookup(domain, (error, ip) => {
    if (error) {
        resolve(false);
    }

    resolve(ip);
}));

export const updateTemplates = async (templatesUrl, prisma) => {
    if (!templatesUrl) return;

    const { templates } = await fetch(templatesUrl).then((res) => res.json());

    if (!templates.length) {
        throw new Error('Not a valid template URL');
    }

    const existingTemplates = await prisma.template.findMany();

    for (const { id, title: name } of existingTemplates) {
        const existingTemplate = templates.find((t) => t.name === name);

        if (!existingTemplate) {
            await prisma.template.update({ where: { id }, data: { enabled: false } });
        }
    }

    for (const template of templates) {
        const { title: name, description, enabled, logo, website, auto, price, trial, adminPath } = template;
        const { categories: [category], repository: { url: repositoryUrl, stackfile: stackFile }, env: envs } = template;

        await prisma.template.upsert({
            where: { name },
            create: { name, description, category, logo, website, auto, enabled, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
            update: { name, description, category, logo, website, auto, enabled, price, trial, adminPath, repositoryUrl, stackFile, envs: JSON.stringify(envs || []) },
        });
    }
};

export const init = async (prisma) => {
    const settings = await prisma.setting.findMany();

    const defaultSettings = [
        { name: 'rootDomain', value: ROOT_DOMAIN },
        { name: 'stripeEnabled', value: STRIPE_ENABLED },
        { name: 'stripePublishableKey', value: STRIPE_PUBLISHABLE_KEY },
        { name: 'stripeSecretKey', value: STRIPE_SECRET_KEY },
        { name: 'templatesUrl', value: TEMPLATES_URL },
    ];

    if (!settings.length) {
        for (const { name, value } of defaultSettings) {
            await prisma.setting.upsert({
                where: { name },
                create: { name, value },
                update: { name, value },
            }).then(true);
        }
    }

    const templatesUrl = settings.find((s) => s.name === 'templatesUrl')
        && settings.find((s) => s.name === 'templatesUrl').value;

    await updateTemplates(templatesUrl || TEMPLATES_URL, prisma);
};

export const generateReleaseName = async (appName, prisma, number = 1) => {
    const releaseName = `${appName}${number}`.toLowerCase();
    const application = await prisma.application.findUnique({ where: { releaseName } });

    if (application) {
        number += 1;
        const newReleaseName = await generateReleaseName(appName, prisma, number);
        return newReleaseName;
    }

    return releaseName;
};

export const validStripe = async (publishableKey, stripeSecretKey) => new Promise((resolve) => {
    const authorization = Buffer.from(`${publishableKey}:`).toString('base64');

    if (!new RegExp(/^sk_/).test(stripeSecretKey)) {
        resolve(false);
    }

    fetch('https://api.stripe.com/v1/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${authorization}` },
        body: 'card[number]=4242424242424242&card[exp_month]=12&card[exp_year]=2017&card[cvc]=123',
    }).then(checkStatus).catch(({ message }) => {
        if (message === 'Payment Required') {
            resolve(true);
        } else {
            resolve(false);
        }
    });
});

export const webhookRequest = async (targetUrl, body, retry = 1) => {
    const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).catch(() => {
        throw new Error('Internal error');
    });

    if (retry >= 3) {
        throw new Error('Internal error');
    }

    if (res.status !== 200) {
        await webhookRequest(targetUrl, body, retry + 1);
    }
};

export const sendWebhooks = async (event, data, prisma) => {
    const webhooks = await prisma.webhook.findMany({ where: { event } });

    for (const { targetUrl } of webhooks) {
        await webhookRequest(targetUrl, data);
    }
};

export const STATES = {
    ONLINE: 'online',
    STANDBY: 'standby',
    OFFLINE: 'offline',
    DELETED: 'deleted',
};

export const EVENTS = {
    REGISTER: 'register',
    UNSUBSCRIBE: 'unsubscribe',
    INSTALL: 'install application',
    UNINSTALL: 'uninstall application',
    UPDATE: 'update application',
    RESETPASSWORD: 'reset password',
};
