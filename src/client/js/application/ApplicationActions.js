import { checkStatus } from '../utils';
import { openModal } from '../modal/ModalActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const installApplicationSuccess = application => ({ type: 'INSTALL_APPLICATION_SUCCESS', application });
export const uninstallApplicationSuccess = releaseName => ({ type: 'UNINSTALL_APPLICATION_SUCCESS', releaseName });
export const listApplicationsSuccess = applications => ({ type: 'LIST_APPLICATIONS_SUCCESS', applications });

export const listApplications = () => (dispatch) => {
    dispatch(openLoader('Loading applications...'));

    fetch('/api/applications')
        .then(checkStatus)
        .then(applications => dispatch(listApplicationsSuccess(applications)) && dispatch(closeLoader()))
        .catch(({ message }) => {
            dispatch(closeLoader());
            dispatch(openModal({ hasErrored: true, errorMessage: message }));
        });
};

export const installApplication = application => (dispatch) => {
    dispatch(installApplicationSuccess(application));

    fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
    })
        .then(checkStatus)
        .catch(({ message }) => {
            dispatch(uninstallApplicationSuccess(application.releaseName));
            dispatch(openModal({ hasErrored: true, errorMessage: message }));
        });
};

export const uninstallApplication = releaseName => (dispatch) => {
    fetch(`/api/applications/${releaseName}`, { method: 'DELETE' })
        .then(checkStatus)
        .then(() => dispatch(uninstallApplicationSuccess(releaseName)))
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};
