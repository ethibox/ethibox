import { checkStatus, isConnect } from '../utils';
import { loadApplications } from '../application/ApplicationActions';
import { loadPackages } from '../package/PackageActions';
import { loadSettingsSuccess } from '../settings/SettingsActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';
import { openModal } from '../modal/ModalActions';

export const synchronizeSuccess = () => ({ type: 'SYNCHRONIZE_SUCCESS' });

export const synchronize = ({ singleSync } = { singleSync: true }) => async (dispatch) => {
    if (singleSync) {
        await dispatch(openLoader('Synchronization...'));
    }

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `{ 
            settings { isDemoEnabled isMonetizationEnabled stripePublishableKey stripeSecretKey stripePlanName monthlyPrice }
            applications { name releaseName domainName category icon state ip port error }
            packages { name category icon }
            user { isAdmin isSubscribed }
        }` }),
    })
        .then(checkStatus)
        .then(async ({ data }) => {
            await dispatch(loadApplications(data.applications));
            await dispatch(loadPackages(data.packages));
            if (singleSync) {
                await dispatch(loadSettingsSuccess({ ...data.settings, ...data.user }));
                await dispatch(closeLoader());
            }
            await dispatch(synchronizeSuccess());
        })
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })) && dispatch(closeLoader()));
};

export const synchronizeInterval = ({ interval } = { interval: 5000 }) => async (dispatch) => {
    await dispatch(synchronize());

    setInterval(async () => {
        if (isConnect()) {
            if (localStorage.getItem('lastActionDate') < Date.now() - interval) {
                await dispatch(synchronize({ singleSync: false }));
            }
        }
    }, interval);
};
