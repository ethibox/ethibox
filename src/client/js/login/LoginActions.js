import { checkStatus, history } from '../utils';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const loginSuccess = token => ({ type: 'LOGIN_SUCCESS', token });
export const loginFailure = error => ({ type: 'LOGIN_FAILURE', error });

export const login = (email, password) => async (dispatch) => {
    dispatch(openLoader('Connection...'));

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation {
            login(email: "${email}", password: "${password}") { token }
        }` }),
    })
        .then(checkStatus)
        .then(({ data }) => {
            dispatch(closeLoader());
            dispatch(loginSuccess(data.login.token));
            history.push('/');
        })
        .catch(({ message }) => dispatch(closeLoader()) && dispatch(loginFailure(message)));
};
