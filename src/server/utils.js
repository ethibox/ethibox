import jwt from 'jsonwebtoken';
import sha1 from 'node-sha1';
import fetch from 'node-fetch';

export const secret = process.env.SECRET || 'mysecret';

export const checkStatus = response => new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status < 300) {
        return response.json().then(resolve);
    }

    console.error(response);

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

export const genUniqReleaseName = (releaseName, email) => `${releaseName}-${sha1(email).slice(0, 5)}`;

export const externalIp = async () => {
    const ip = await fetch('http://ipinfo.io/ip', { headers: { 'User-Agent': 'curl/7.37.1' } });
    return (await ip.text()).trim();
};
