import { checkStatus } from '../utils';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const registerSuccess = token => ({ type: 'REGISTER_SUCCESS', token });
export const registerFailure = error => ({ type: 'REGISTER_FAILURE', error });
export const loginSuccess = token => ({ type: 'LOGIN_SUCCESS', token });
export const loginFailure = error => ({ type: 'LOGIN_FAILURE', error });

export const register = (email, password) => (dispatch) => {
    dispatch(openLoader('Registration...'));

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
        .then(checkStatus)
        .then(({ token }) => dispatch(registerSuccess(token)))
        .catch(({ message }) => {
            dispatch(closeLoader());
            dispatch(registerFailure(message));
        });
};

export const login = (email, password) => (dispatch) => {
    dispatch(openLoader('Connection...'));

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
        .then(checkStatus)
        .then(({ token }) => dispatch(loginSuccess(token)))
        .catch(({ message }) => {
            dispatch(closeLoader());
            dispatch(loginFailure(message));
        });
};
