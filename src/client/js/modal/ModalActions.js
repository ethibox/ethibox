import { history } from '../utils';

export const openModal = (params) => {
    if (params.errorMessage === 'Subscription is required') {
        history.push('/subscribe');
    }

    if (params.errorMessage === 'Not authorized') {
        params.redirectUrl = '/logout';
    }

    return { type: 'OPEN_MODAL', params };
};

export const closeModal = (params) => {
    if (params.redirectUrl) {
        history.push(params.redirectUrl);
    }

    return { type: 'CLOSE_MODAL', params };
};
