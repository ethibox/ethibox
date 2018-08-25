import 'isomorphic-fetch';
import dns from 'dns';
import https from 'https';
import jwt from 'jsonwebtoken';
import { Settings, Package } from './models';

export const secret = process.env.SECRET || 'mysecret';

export const checkStatus = response => new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status < 300) {
        return response.json().then(resolve);
    }

    return response.json().then(reject);
});

export const isAuthenticate = (token) => {
    try {
        jwt.verify(token, secret);
        return true;
    } catch ({ message }) {
        return false;
    }
};

export const checkDnsRecord = async (domainName, serverIp) => {
    const dnsError = `DNS error, create a correct A record for your domain: ${domainName}. IN A ${serverIp}.`;
    const domainNameIp = await new Promise((resolve, reject) => dns.lookup(domainName, (error, address) => {
        if (error) {
            reject(new Error(dnsError));
        }
        resolve(address);
    }));

    if (serverIp !== domainNameIp) {
        throw new Error(dnsError);
    }
};

export const publicIp = async () => {
    const ip = await fetch('http://ipinfo.io/ip', { headers: { 'User-Agent': 'curl/7.37.1' } });
    return (await ip.text()).trim();
};

export const synchronizeStore = async (storeRepositoryUrl) => {
    try {
        const res = await fetch(storeRepositoryUrl);
        const packages = (await res.json());
        packages.forEach(async (pkg) => {
            if (!await Package.findOne({ where: { name: pkg.name }, raw: true })) {
                await Package.create(pkg);
            }
            await Package.update(pkg, { where: { name: pkg.name } });
        });
    } catch (e) {
        throw new Error('Invalid store repository URL');
    }
};

export const getSettings = async () => {
    let settings = await Settings.findAll({ raw: true });
    settings = Object.assign({}, ...(settings.map(item => ({ [item.name]: (['0', '1'].includes(item.value)) ? (item.value == true) : item.value })))); // eslint-disable-line
    return settings;
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

export const checkUrl = async (url) => {
    try {
        const { status } = await timeout(10000, fetch(url));
        return (status === 200);
    } catch (e) {
        return false;
    }
};

export const checkOrchestratorConnection = async (endpoint, token) => {
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const { status } = await timeout(10000, fetch(`${endpoint}/healthz`, { headers: { Authorization: `Bearer ${token}` }, agent }));
        return (status === 200);
    } catch (e) {
        return false;
    }
};

export const STATES = {
    INSTALLING: 'installing',
    UNINSTALLING: 'uninstalling',
    EDITING: 'editing',
    RUNNING: 'running',
};

export const ACTIONS = {
    INSTALL: 'install',
    UNINSTALL: 'uninstall',
    EDIT: 'edit',
};
