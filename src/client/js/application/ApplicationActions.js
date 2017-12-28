import { checkStatus } from '../utils';
import { openModal } from '../modal/ModalActions';

export const installApplicationSuccess = application => ({ type: 'INSTALL_APPLICATION_SUCCESS', application });
export const installApplicationHasErrored = bool => ({ type: 'INSTALL_APPLICATION_HAS_ERRORED', hasErrored: bool });
export const installApplicationLoading = bool => ({ type: 'INSTALL_APPLICATION_LOADING', isLoading: bool });
export const uninstallApplicationSuccess = releaseName => ({ type: 'UNINSTALL_APPLICATION_SUCCESS', releaseName });
export const uninstallApplicationHasErrored = bool => ({ type: 'UNINSTALL_APPLICATION_HAS_ERRORED', hasErrored: bool });
export const uninstallApplicationLoading = bool => ({ type: 'UNINSTALL_APPLICATION_LOADING', isLoading: bool });
export const listApplicationsSuccess = applications => ({ type: 'LIST_APPLICATIONS_SUCCESS', applications });
export const listApplicationsHasErrored = bool => ({ type: 'LIST_APPLICATIONS_HAS_ERRORED', hasErrored: bool });
export const listApplicationsLoading = bool => ({ type: 'LIST_APPLICATIONS_LOADING', isLoading: bool });

export const listApplications = () => (dispatch) => {
    dispatch(listApplicationsLoading(true));

    fetch('/api/applications')
        .then(checkStatus)
        .then(data => data.json())
        .then(applications => dispatch(listApplicationsSuccess(applications)))
        .catch(() => {
            dispatch(openModal());
            dispatch(listApplicationsHasErrored(true));
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
        .catch(() => {
            dispatch(openModal());
            dispatch(uninstallApplicationSuccess(application.releaseName));
            dispatch(installApplicationHasErrored(true));
        });
};

export const uninstallApplication = releaseName => (dispatch) => {
    dispatch(uninstallApplicationLoading(true));

    fetch(`/api/applications/${releaseName}`, { method: 'DELETE' })
        .then(checkStatus)
        .then(() => dispatch(uninstallApplicationSuccess(releaseName)))
        .catch(() => dispatch(uninstallApplicationHasErrored(true)));
};
