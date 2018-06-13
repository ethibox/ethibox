import { checkStatus, history } from '../utils';
import { openModal } from '../modal/ModalActions';

export const installApplicationSuccess = application => ({ type: 'INSTALL_APPLICATION_SUCCESS', application });
export const uninstallApplicationSuccess = (releaseName, force) => ({ type: 'UNINSTALL_APPLICATION_SUCCESS', releaseName, force });
export const editApplicationSuccess = releaseName => ({ type: 'EDIT_APPLICATION_SUCCESS', releaseName });
export const loadApplications = applications => ({ type: 'LOAD_APPLICATIONS', applications });

export const installApplication = application => async (dispatch) => {
    const { name, releaseName } = application;
    dispatch(installApplicationSuccess(application));
    history.push('/');

    fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            installApplication(name: "${name}", releaseName: "${releaseName}") { releaseName }
        }` }),
    })
        .then(checkStatus)
        .catch(({ message }) => {
            dispatch(uninstallApplicationSuccess(releaseName, true));
            dispatch(openModal({ hasErrored: true, errorMessage: message }));
        });
};

export const uninstallApplication = releaseName => (dispatch) => {
    dispatch(uninstallApplicationSuccess(releaseName));

    fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            uninstallApplication(releaseName: "${releaseName}") { releaseName }
        }` }),
    })
        .then(checkStatus)
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};

export const editDomainNameApplication = application => (dispatch) => {
    const { releaseName, domainName } = application;
    dispatch(editApplicationSuccess(releaseName));

    fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('token') },
        body: JSON.stringify({ query: `mutation {
            editDomainNameApplication(releaseName: "${releaseName}", domainName: "${domainName}") { releaseName }
        }` }),
    })
        .then(checkStatus)
        .catch(({ message }) => dispatch(openModal({ hasErrored: true, errorMessage: message })));
};
