import createHistory from 'history/createBrowserHistory';
import jwtDecode from 'jwt-decode';

export const checkStatus = response => new Promise((resolve, reject) => {
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

export const isConnect = () => {
    try {
        const token = jwtDecode(localStorage.getItem('token'));
        const tokenExpiration = token.exp;
        const { userId } = token;
        const now = Math.floor(Date.now() / 1000);

        if (!userId || !tokenExpiration) {
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

export const history = createHistory();

export const isToastNotExist = (message) => {
    const selector = '.ui-alerts .pulse:last-child .message .content p';

    if (document.querySelector(selector) && document.querySelector(selector).innerText === message) {
        return false;
    }

    return true;
};

export const getParameterByName = (name) => {
    const match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
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
