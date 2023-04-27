import 'dotenv/config';
import dns from 'dns';
import isEmail from 'validator/lib/isEmail';
import blocklist from '@lib/blocklist.json';
import { Op, User, App } from '@lib/orm';
import fetch from 'node-fetch';

export const isValidEmail = (email) => new Promise((resolve, reject) => {
    if (!isEmail(email)) {
        reject(new Error('Your email is invalid'));
    }

    const domain = email.split('@')[1];

    if (blocklist.includes(domain)) {
        reject(new Error('Your email is not allowed'));
    }

    dns.resolve(domain, 'MX', (err, addresses) => {
        if (err) {
            reject(new Error('Your email is invalid'));
        } else if (addresses && addresses.length > 0) {
            resolve(true);
        }
    });
});

export const isValidPassword = (password) => new Promise((resolve, reject) => {
    if (password.length < 6) {
        reject(new Error('Your password must be at least 6 characters'));
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        reject(new Error('Your password must contain a symbol like !@#$%^&*(),.?":{}|<>'));
    }

    resolve(true);
});

export const protectRoute = (fn) => async (req, res) => {
    const email = res.getHeader('email');
    const user = await User.findOne({ where: { email }, raw: false });
    if (!user) return res.status(401).send({ success: false, message: 'You are not authenticated' });

    return fn(req, res, user);
};

export const isObjectEmpty = (obj = {}) => !Object.keys(obj).length;

export const sendWebhook = async (data, retry = 1) => {
    if (!process.env.WEBHOOK_URL || process.env.NODE_ENV === 'test') return;

    const res = await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (retry >= 3) {
        return;
    }

    if (res.status !== 200) {
        await sendWebhook(data, retry + 1);
    }
};

export const mockApi = (user) => ({
    status: (status) => ({
        send: (data) => ({ ...data, status }),
    }),
    getHeader: () => user.email,
});

export const generateReleaseName = async (name) => {
    const apps = await App.findAll({ where: { releaseName: { [Op.like]: `${name.toLowerCase()}%` } } });
    return `${name.toLowerCase()}${apps.length + 1}`;
};

export const getDomainIp = (domain) => new Promise((resolve) => {
    dns.lookup(domain, { family: 4 }, (error, ip) => {
        if (error) resolve(false);
        resolve(ip);
    });
});

export const checkDnsRecord = (domain, ip) => new Promise((resolve, reject) => {
    dns.lookup(domain, { family: 4 }, (error, address) => {
        if (ip === address) resolve(true);
        reject(new Error('DNS record not found'));
    });
});

export const decodeUnicode = (str) => str.replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

export const checkDomain = async (domain) => {
    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());
    const appNames = templates.map((t) => t.title.toLowerCase());
    const escapeRegExp = (str) => str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');

    const unallowedDomains = appNames.map((n) => `${escapeRegExp(n)}[0-9]*.${escapeRegExp(process.env.ROOT_DOMAIN)}`);
    const regex = new RegExp(unallowedDomains.join('|'), 'g');

    return !regex.test(domain);
};
