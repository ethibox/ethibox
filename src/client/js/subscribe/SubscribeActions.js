import { checkStatus } from '../utils';
import { openLoader, closeLoader } from '../loader/LoaderActions';
import { openModal } from '../modal/ModalActions';
import { synchronize } from '../synchronize/SynchronizeActions';

export const subscribeSuccess = () => ({ type: 'SUBSCRIBE_SUCCESS' });
export const subscribeError = error => ({ type: 'SUBSCRIBE_ERROR', error });

export const subscribe = (name, number, expMonth, expYear, cvc) => async (dispatch) => {
    dispatch(openLoader('Subscribe...'));

    const stripeToken = await new Promise((resolve, reject) => Stripe.createToken({ name, number, expMonth, expYear, cvc }, (_, response) => {
        if (response.error) {
            reject(new Error(response.error.message));
        } else {
            resolve(response.id);
        }
    }))
        .catch(({ message }) => dispatch(closeLoader()) && dispatch(subscribeError(message)));

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            subscribe(stripeToken: "${stripeToken}") { id }
        }` }),
    })
        .then(checkStatus)
        .then(() => {
            dispatch(closeLoader());
            dispatch(subscribeSuccess());
            dispatch(synchronize());
            dispatch(openModal({ successMessage: 'Congratulation! You have a premium account' }));
        })
        .catch(({ message }) => dispatch(closeLoader()) && dispatch(subscribeError(message)));
};
