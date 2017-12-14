export const addApplication = application => ({ type: 'ADD_APPLICATION', application });
export const removeApplication = releaseName => ({ type: 'REMOVE_APPLICATION', releaseName });
export const listApplicationsSuccess = applications => ({ type: 'LIST_APPLICATIONS_SUCCESS', applications });

export const listApplications = () => (dispatch) => {
    fetch('/api/applications')
        .then(data => data.json())
        .then(applications => dispatch(listApplicationsSuccess(applications)));
};

export const installApplication = application => (dispatch) => {
    dispatch(addApplication(application));

    fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
    });
};

export const uninstallApplication = releaseName => (dispatch) => {
    dispatch(removeApplication(releaseName));
    fetch(`/api/applications/${releaseName}`, { method: 'DELETE' });
};
