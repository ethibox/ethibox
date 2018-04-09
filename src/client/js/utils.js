import createHistory from 'history/createBrowserHistory';
import jwtDecode from 'jwt-decode';

export const checkStatus = response => new Promise((resolve, reject) => {
    response.json().then((res) => {
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
