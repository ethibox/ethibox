import { isConnect, dataToken, checkStatus } from './utils';
import { listApplicationsSuccess } from './application/ApplicationActions';
import { listPackages } from './package/PackageActions';
import { openLoader, closeLoader } from './loader/LoaderActions';
import { openModal } from './modal/ModalActions';

const interval = process.env.NODE_ENV === 'production' ? 5000 : 2000;

export default (store) => {
    if (isConnect()) {
        store.dispatch(openLoader('Loading applications...'));

        const synchronize = async () => {
            await fetch('/api/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
                body: JSON.stringify({ query: `{ 
                    packages { name category icon }
                    applications(email: "${dataToken.email}") { name releaseName domainName category icon state ip port error }
                }` }),
            })
                .then(checkStatus)
                .then(({ data }) => {
                    store.dispatch(listApplicationsSuccess(data.applications));
                    store.dispatch(listPackages(data.packages));
                    store.dispatch(closeLoader());
                })
                .catch(({ message }) => store.dispatch(openModal({ hasErrored: true, errorMessage: message })) && store.dispatch(closeLoader()));
        };

        synchronize();
        setInterval(() => {
            if (localStorage.getItem('lastActionDate') < Date.now() - interval) {
                synchronize();
            }
        }, interval);
    }
};
