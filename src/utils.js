import jwt from 'jsonwebtoken';
import md5 from 'blueimp-md5';
import { navigate as navigateGatsby, withPrefix } from 'gatsby';

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
        const token = isBrowser() && jwt.decode(getToken());
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

export const userInfo = () => isBrowser() && jwt.decode(getToken());

export const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export const getParameterByName = (name) => {
    if (typeof window !== 'undefined') {
        const match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    return false;
};

export const remainingTimePercentage = (startTime, endTime, bonus = 0) => {
    const now = new Date().getTime();

    const totalTime = endTime - startTime;
    const progress = now - startTime;
    const percentage = (progress / totalTime) * 100;

    if (percentage >= 100) {
        return 100;
    }

    return Math.round(percentage + bonus);
};

export const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export const gravatar = (email, size = 80) => `https://www.gravatar.com/avatar/${md5(email)}.jpg?s=${size}&d=mp`;
