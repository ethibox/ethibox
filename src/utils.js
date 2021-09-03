import { decode } from 'base-64';
import { withPrefix } from 'gatsby';
import { navigate as navigateGatsby } from 'gatsby-plugin-intl';

export const jwtDecode = (token) => {
    const payloadBase64 = token.split('.')[1].replace('-', '+').replace('_', '/');
    const payloadDecoded = decode(payloadBase64);
    const payloadObject = JSON.parse(payloadDecoded);

    return payloadObject;
};

export const checkStatus = (response) => new Promise((resolve, reject) => {
    if (response.status !== 200) {
        return reject(new Error(response.statusText));
    }

    return response.json().then((res) => {
        if (res.errors) {
            reject(res.errors[0]);
        }

        resolve(res);
    });
});

export const redirect = (path) => {
    if (typeof document !== 'undefined') {
        document.location.href = withPrefix(path);
    }
};

export const isBrowser = () => typeof window !== 'undefined';

export const getItem = (name) => isBrowser() && localStorage.getItem(name);

export const setItem = (name, item) => isBrowser() && localStorage.setItem(name, item);

export const removeItem = (name) => isBrowser() && localStorage.removeItem(name);

export const getToken = () => isBrowser() && localStorage.getItem('token');

export const removeToken = () => removeItem('token');

export const setToken = (token) => isBrowser() && localStorage.setItem('token', token);

export const clear = () => isBrowser() && localStorage.clear();

export const navigate = (path) => isBrowser() && navigateGatsby(path);

export const isLoggedIn = () => {
    try {
        const token = isBrowser() && jwtDecode(getToken());
        const tokenExpiration = token.exp;
        const userEmail = token.email;

        const now = Math.floor(Date.now() / 1000);

        if (!userEmail || !tokenExpiration) {
            return false;
        }

        if (now < tokenExpiration) {
            return true;
        }
    } catch (e) {
        return false;
    }

    return false;
};

export const autocast = (string) => {
    if (string === null) {
        return '';
    }

    if (!string.length) {
        return '';
    }

    if (!Number.isNaN(Number(string))) {
        return Number(string);
    }

    if ((string === 'true')) {
        return true;
    }

    if ((string === 'false')) {
        return false;
    }

    return string;
};

export const decamelize = (str, separator = ' ') => str.replace(/([a-z\d])([A-Z])/g, `$1${separator}$2`).toLowerCase();

export const userInfo = () => isBrowser() && jwtDecode(getToken());

export const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export const getParameterByName = (name) => {
    if (typeof window !== 'undefined') {
        const match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    return false;
};

export const remainingTimePercentage = (startTime, endTime) => {
    const now = new Date().getTime();

    const totalTime = endTime - startTime;
    const progress = now - startTime;
    const percentage = (progress / totalTime) * 100;

    if (percentage >= 100) {
        return 100;
    }

    return Math.round(percentage);
};

export const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
