import jwtDecode from 'jwt-decode';

export const checkStatus = response => new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status < 300) {
        return response.json().then(resolve);
    }

    return response.json().then(reject);
});

export const dataToken = localStorage.getItem('token') ? jwtDecode(localStorage.getItem('token')) : {};

export const isConnect = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const now = Math.floor(Date.now() / 1000);
    const tokenExpiration = jwtDecode(token).exp;

    if (now > tokenExpiration) {
        return false;
    }

    return true;
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
