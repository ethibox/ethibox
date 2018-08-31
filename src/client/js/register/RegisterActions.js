import { checkStatus, history } from '../utils';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const registerSuccess = token => ({ type: 'REGISTER_SUCCESS', token });
export const registerFailure = error => ({ type: 'REGISTER_FAILURE', error });

export const register = (email, password) => async (dispatch) => {
    dispatch(openLoader('Registration...'));

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation {
            register(email: "${email}", password: "${password}") { token, isAdmin }
        }` }),
    })
        .then(checkStatus)
        .then(({ data }) => {
            const { token, isAdmin } = data.register;
            dispatch(closeLoader());
            dispatch(registerSuccess(token));
            const redirectPath = isAdmin ? '/settings' : '/';
            history.push(redirectPath);
        })
        .catch(({ message }) => dispatch(closeLoader()) && dispatch(registerFailure(message)));
};
