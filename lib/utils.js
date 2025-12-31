import fs from 'fs';
import dns from 'dns';
import path from 'path';
import crypto from 'crypto';
import nodeFetch from 'node-fetch';
import { Op } from 'sequelize';
import isEmail from 'validator/lib/isEmail';
import { App } from './orm';
import en from '../public/locales/en/common.json';
import fr from '../public/locales/fr/common.json';
import { DEFAULT_LOCALE, TEMPLATES_URL, EMAIL_BLOCKLIST } from './constants';

export const getDomainIp = (domain) => new Promise((resolve) => {
    dns.lookup(domain, { family: 4 }, (error, ip) => {
        if (error) resolve(false);
        resolve(ip);
    });
});

export const generateReleaseName = async (name) => {
    const apps = await App.findAll({ where: { releaseName: { [Op.like]: `${name.toLowerCase()}%` } } });
    return `${name.toLowerCase()}${apps.length + 1}`;
};

export const generatePassword = (length = 12, wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@%&*_+') => {
    let password;

    const isValidPassword = (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@%&*_+]/.test(pwd);

    do {
        password = Array.from({ length }, () => {
            let byte;
            do { [byte] = crypto.randomBytes(1); } while (byte >= Math.floor(256 / wishlist.length) * wishlist.length);
            return wishlist[byte % wishlist.length];
        }).join('');
    } while (!isValidPassword(password));

    return password;
};

export const isValidPassword = (password) => new Promise((resolve, reject) => {
    if (password.length < 6) {
        reject(new Error('password_too_short'));
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        reject(new Error('password_no_symbol'));
    }

    resolve(true);
});

export const isDisposableDomain = async (domain) => {
    const response = await fetch(EMAIL_BLOCKLIST);
    const text = await response.text();
    const disposableDomains = text.split('\n');

    return disposableDomains.includes(domain.toLowerCase());
};

export const isValidEmail = async (email) => {
    if (!isEmail(email)) {
        throw new Error('invalid_email');
    }

    const domain = email.split('@')[1];

    if (await isDisposableDomain(domain)) {
        throw new Error('email_disposable');
    }

    return new Promise((resolve, reject) => {
        dns.resolve(domain, 'MX', (err, addresses) => {
            if (err) {
                reject(new Error('invalid_email'));
            } else if (addresses && addresses.length > 0) {
                resolve(true);
            }
        });
    });
};

export const fetchTemplates = async (enabled = true) => {
    const templatesFile = path.join(process.cwd(), 'data', 'templates.json');

    if (!fs.existsSync(templatesFile)) {
        await nodeFetch(TEMPLATES_URL)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data) return;
                fs.mkdirSync(path.dirname(templatesFile), { recursive: true });
                fs.writeFileSync(templatesFile, JSON.stringify(data, null, 2), 'utf8');
            })
            .catch(() => {});
    }

    const file = fs.readFileSync(templatesFile, 'utf8');

    let { templates } = JSON.parse(file);

    if (enabled) {
        templates = templates.filter((t) => t?.enabled);
    }

    templates = templates.map(({ title, categories, enabled: _, ...rest }) => ({
        category: Array.isArray(categories) ? categories[0] ?? null : null,
        name: title,
        ...rest,
    }));

    return templates;
};

export const isValidDomain = async (domain, ip) => {
    if (!/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/.test(domain)) {
        throw new Error('domain_invalid');
    }

    const templates = await fetchTemplates();

    const baseSubdomain = domain.split('.')[0].replace(/\d+$/, '');
    const reservedNames = templates.map((t) => t.name.toLowerCase());

    if (domain.includes(process.env.ROOT_DOMAIN || 'localhost') && reservedNames.includes(baseSubdomain.toLowerCase())) {
        throw new Error('domain_reserved');
    }

    if (await getDomainIp(domain) !== ip) {
        throw new Error('domain_dns_error');
    }

    return true;
};

export const triggerWebhook = async (event, data, retry = 0) => {
    if (!process.env.WEBHOOK_URL || retry >= 3) return false;

    const res = await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Ethibox-Webhooks/1.0',
            'X-Ethibox-Event': event,
        },
        body: JSON.stringify({
            data,
            event,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        }),
    }).catch(() => false);

    if (res.status !== 200) {
        await triggerWebhook(event, data, retry + 1);
    }

    return res;
};

export const useTranslation = (lang = DEFAULT_LOCALE) => {
    const translations = { en, fr };
    const locale = translations[lang] ? lang : DEFAULT_LOCALE;

    const t = (key, options) => {
        let translation = translations[locale]?.api?.[key] || key;
        if (options && typeof translation === 'string') {
            Object.entries(options).forEach(([k, value]) => {
                translation = translation.replace(new RegExp(`{{${k}}}`, 'g'), value);
            });
        }
        return translation;
    };

    return t;
};

export const decodeUnicode = (str) => str.replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

export const getCustomEnvs = (appName) => {
    const appPrefix = `CUSTOM_ENV_${appName.toUpperCase()}_`;
    const globalPrefix = 'CUSTOM_ENV_ALL_';

    const envs = [];

    Object.keys(process.env).forEach((key) => {
        if (key.startsWith(appPrefix) || key.startsWith(globalPrefix)) {
            const envName = key.substring(key.startsWith(appPrefix) ? appPrefix.length : globalPrefix.length);
            const envValue = process.env[key];
            envs.push({ name: envName, value: decodeUnicode(envValue) });
        }
    });

    return envs;
};
