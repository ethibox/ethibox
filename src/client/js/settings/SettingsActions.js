import { checkStatus } from '../utils';
import { openModal } from '../modal/ModalActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const loadSettingsSuccess = settings => ({ type: 'LOAD_SETTINGS_SUCCESS', settings });

export const loadSettings = () => async (dispatch) => {
    dispatch(openLoader('Loading settings...'));

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `{ 
            settings {
                orchestratorName
                orchestratorEndpoint
                orchestratorToken
                storeRepositoryUrl
                isDemoEnabled
                isMonetizationEnabled
                stripePublishableKey
                stripeSecretKey
                monthlyPrice
                stripePlanName
                isPersistenceEnabled
            }
            user { isAdmin isSubscribed }
        }` }),
    })
        .then(checkStatus)
        .then(({ data }) => {
            dispatch(closeLoader());
            dispatch(loadSettingsSuccess({ ...data.settings, ...data.user }));
        })
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })) && dispatch(closeLoader()));
};

export const updatePassword = password => async (dispatch) => {
    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            updatePassword(password: "${password}") { id }
        }` }),
    })
        .then(checkStatus)
        .then(() => dispatch(openModal({ successMessage: 'Password updated!' })))
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};

export const unsubscribe = () => async (dispatch) => {
    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            unsubscribe { id }
        }` }),
    })
        .then(checkStatus)
        .then(() => dispatch(loadSettings()) && dispatch(openModal({ successMessage: 'Unsubscribe successfull' })))
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};

export const updateAdminSettings = settings => async (dispatch) => {
    dispatch(openLoader('Update settings...'));

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            updateAdminSettings(
                settings: {
                    orchestratorName: "${settings.orchestratorName}",
                    orchestratorEndpoint: "${settings.orchestratorEndpoint}",
                    orchestratorToken: "${settings.orchestratorToken}",
                    storeRepositoryUrl: "${settings.storeRepositoryUrl}",
                    isMonetizationEnabled: ${settings.isMonetizationEnabled},
                    stripeSecretKey: "${settings.stripeSecretKey}",
                    stripePublishableKey: "${settings.stripePublishableKey}"
                    stripePlanName: "${settings.stripePlanName}"
                    isPersistenceEnabled: ${settings.isPersistenceEnabled}
                }) { isMonetizationEnabled }
        }` }),
    })
        .then(checkStatus)
        .then(() => {
            dispatch(loadSettings());
            dispatch(closeLoader());
            dispatch(openModal({ successMessage: 'Configuration updated!' }));
        })
        .catch(({ message }) => dispatch(closeLoader()) && dispatch(openModal({ hasErrored: true, errorMessage: message })));
};
