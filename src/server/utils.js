import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export const secret = process.env.SECRET || 'mysecret';

export const checkStatus = response => new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status < 300) {
        return response.json().then(resolve);
    }

    return response.json().then(reject);
});

export const findVal = (object, key) => {
    let value;
    Object.keys(object).some((k) => {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key);
            return value !== undefined;
        }
    });
    return value;
};

export const isAuthenticate = (token) => {
    try {
        jwt.verify(token, secret);
        return true;
    } catch ({ message }) {
        return false;
    }
};

export const publicIp = async () => {
    const ip = await fetch('http://ipinfo.io/ip', { headers: { 'User-Agent': 'curl/7.37.1' } });
    return (await ip.text()).trim();
};

export const STATES = {
    RUNNING: 'running',
    LOADING: 'loading',
    UNINSTALLING: 'uninstalling',
    INSTALLING: 'installing',
    EDITING: 'editing',
};

export const ACTIONS = {
    INSTALL: 'install',
    UNINSTALL: 'uninstall',
    EDIT: 'edit',
};
