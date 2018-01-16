import { checkStatus } from '../utils';
import { openModal } from '../modal/ModalActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';

export const installApplicationSuccess = application => ({ type: 'INSTALL_APPLICATION_SUCCESS', application });
export const uninstallApplicationSuccess = releaseName => ({ type: 'UNINSTALL_APPLICATION_SUCCESS', releaseName });
export const listApplicationsSuccess = applications => ({ type: 'LIST_APPLICATIONS_SUCCESS', applications });

export const listApplications = () => (dispatch) => {
    dispatch(openLoader('Loading applications...'));

    socket.on('listApplications', (apps) => {
        dispatch(closeLoader());
        if (localStorage.getItem('lastActionDate') < Date.now() - 5000) {
            dispatch(listApplicationsSuccess(apps));
        }
    });
};

export const installApplication = application => async (dispatch) => {
    dispatch(installApplicationSuccess(application));

    const releases = await fetch('/api/applications', {
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
    })
        .then(checkStatus)
        .catch(({ message }) => {
            dispatch(uninstallApplicationSuccess(application.releaseName));
            dispatch(openModal({ hasErrored: true, errorMessage: message }));
        });

    const releaseNames = releases.map(release => release.releaseName);

    if (!releaseNames.includes(application.releaseName)) {
        fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
            body: JSON.stringify(application),
        })
            .then(checkStatus)
            .catch(({ message }) => {
                dispatch(uninstallApplicationSuccess(application.releaseName));
                dispatch(openModal({ hasErrored: true, errorMessage: message }));
            });
    } else {
        dispatch(uninstallApplicationSuccess(application.releaseName));
        dispatch(openModal({ hasErrored: true, errorMessage: "Application's name already taken" }));
    }
};

export const uninstallApplication = releaseName => (dispatch) => {
    dispatch(uninstallApplicationSuccess(releaseName));

    fetch(`/api/applications/${releaseName}`, {
        method: 'DELETE',
        headers: { 'x-access-token': localStorage.getItem('token') },
    })
        .then(checkStatus)
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};
