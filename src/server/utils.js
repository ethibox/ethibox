import 'isomorphic-fetch';
import dns from 'dns';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const secret = process.env.SECRET || crypto.randomBytes(32).toString('hex');

export const tokenExpiration = process.env.TOKEN_EXPIRATION || '30d';

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

export const checkUrl = (url) => new Promise((resolve, reject) => {
    timeout(10000, fetch(url, { redirect: 'follow' })).then(({ status }) => {
        if (status === 200) {
            resolve(true);
        } else {
            reject(new Error('Status code error'));
        }
    }).catch((e) => {
        if (e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || e.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
            reject(new Error('Certificate error'));
        }

        reject(new Error('Error'));
    });
});

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isValidToken = (token) => {
    try {
        if (token) {
            return jwt.verify(token, secret);
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

export const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
        await callback(array[index], index, array);
    }
};

export const initSettings = async (prisma) => {
    const settings = await prisma.setting.findMany();

    if (!settings.length) {
        const defaultSettings = [
            { name: 'rootDomain', value: 'local.ethibox.fr' },
            { name: 'checkDomain', value: 'false' },
            { name: 'appsUserLimit', value: '10' },
            { name: 'stripeEnabled', value: process.env.STRIPE_ENABLED || 'false' },
            { name: 'stripePublishableKey', value: process.env.STRIPE_PUBLISHABLE_KEY || '' },
            { name: 'stripeSecretKey', value: process.env.STRIPE_SECRET_KEY || '' },
        ];

        await asyncForEach(defaultSettings, async ({ name, value }) => {
            await prisma.setting.upsert({
                where: { name },
                create: { name, value },
                update: { name, value },
            }).then(true);
        });
    }
};

export const checkPortainer = async (endpoint, username, password) => {
    if (!endpoint) {
        console.error('No portainer endpoint');
        process.exit(1);
    }

    await fetch(`${endpoint}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
        .then(checkStatus)
        .catch(() => {
            console.error('Bad portainer logins');
            process.exit(1);
        });
};

export const init = (prisma) => {
    (async () => {
        const { PORTAINER_ENDPOINT: endpoint, PORTAINER_USERNAME: username, PORTAINER_PASSWORD: password } = process.env;

        if (!process.env.CI) {
            await checkPortainer(endpoint, username, password);
        }

        await initSettings(prisma);
    })();
};

export const generateReleaseName = async (appName, prisma, number = 1) => {
    const releaseName = `${appName}${number}`.toLowerCase();
    const application = await prisma.application.findOne({ where: { releaseName } });

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

export const fileToJson = async (createReadStream) => {
    const result = await new Promise((resolve) => {
        const stream = createReadStream();
        stream.setEncoding('utf8');

        let data = '';

        stream.on('data', (chunk) => { data += chunk; });

        stream.on('end', () => {
            const json = JSON.parse(data);

            if (!Array.isArray(json)) {
                resolve([]);
            }

            resolve(json);
        });
    });

    return result;
};

export const webhookRequest = async (targetUrl, body, retry = 1) => {
    const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).catch(() => {
        throw new Error('Webhook endpoint error');
    });

    if (retry >= 3) {
        throw new Error('Webhook endpoint error');
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
    INSTALLING: 'installing',
    UNINSTALLING: 'uninstalling',
    EDITING: 'editing',
    RUNNING: 'running',
    DELETED: 'deleted',
};

export const TASKS = {
    INSTALL: 'install',
    UNINSTALL: 'uninstall',
    EDIT: 'edit',
};

export const EVENTS = {
    REGISTER: 'register',
    UNSUBSCRIBE: 'unsubscribe',
    INSTALL: 'install',
    UNINSTALL: 'uninstall',
    UPDATE_DOMAIN: 'update_domain',
};
