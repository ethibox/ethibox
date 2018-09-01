import { toast } from 'react-semantic-toasts';
import { checkStatus, isConnect, isToastNotExist } from '../utils';
import { loadApplications } from '../application/ApplicationActions';
import { loadPackages } from '../package/PackageActions';
import { loadSettingsSuccess } from '../settings/SettingsActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const synchronizeSuccess = () => ({ type: 'SYNCHRONIZE_SUCCESS' });

export const synchronize = ({ singleSync } = { singleSync: true }) => async (dispatch) => {
    if (singleSync) {
        await dispatch(openLoader('Synchronization...'));
    }

    await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `{ 
            settings {
                orchestratorName
                orchestratorEndpoint
                orchestratorToken
                isOrchestratorOnline
                isOrchestratorConfigMissing
                isDemoEnabled
                isMonetizationEnabled
                stripePublishableKey
                stripeSecretKey
                monthlyPrice
                stripePlanName
                storeRepositoryUrl
            }
            applications { name releaseName domainName category icon state ip port error }
            packages { name category icon enabled }
            user { isAdmin isSubscribed }
        }` }),
    })
        .then(checkStatus)
        .then(async ({ data }) => {
            const { isOrchestratorOnline, isOrchestratorConfigMissing } = data.settings;
            const { isAdmin } = data.user;

            await dispatch(loadApplications(data.applications));
            await dispatch(loadPackages(data.packages));

            if (singleSync) {
                await dispatch(loadSettingsSuccess({ ...data.settings, ...data.user }));
                await dispatch(closeLoader());

                if (isAdmin && !isOrchestratorConfigMissing && !isOrchestratorOnline) {
                    toast({ type: 'error', icon: 'cancel', title: 'Error', description: 'Orchestrator connection failed!', time: 10000 });
                }

                if (isAdmin && isOrchestratorConfigMissing) {
                    toast({ type: 'info', icon: 'info', title: 'Info', description: 'You need to configure orchestrator configuration.', time: 10000 });
                }
            }

            await dispatch(synchronizeSuccess());
        })
        .catch(({ message }) => {
            dispatch(closeLoader());

            if (message === 'NetworkError when attempting to fetch resource.') {
                return;
            }

            if (message === 'Not authorized') {
                localStorage.clear();
                window.location.replace('/login?unauthorized=true');
                return;
            }

            if (isToastNotExist(message)) {
                toast({ type: 'error', icon: 'cancel', title: 'Error', description: message, time: 0 });
            }
        });
};

export const synchronizeInterval = ({ interval } = { interval: 5000 }) => async (dispatch) => {
    setInterval(async () => {
        if (isConnect()) {
            if (localStorage.getItem('lastActionDate') < Date.now() - interval) {
                await dispatch(synchronize({ singleSync: false }));
            }
        } else {
            localStorage.clear();
            window.location.replace('/login?expired=true');
        }
    }, interval);
};
