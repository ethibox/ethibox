export const updateApplication = app => ({ type: 'UPDATE_APPLICATION', app });
export const uninstallApplication = id => ({ type: 'UNINSTALL_APPLICATION', id });
export const listApplicationsSuccess = applications => ({ type: 'LIST_APPLICATIONS_SUCCESS', applications });

export const listApplications = () => (dispatch) => {
    fetch('/api/application/list')
        .then(data => data.json())
        .then((applications) => {
            dispatch(listApplicationsSuccess(applications));
        });
};

export const installApplication = ({ name, releaseName }) => () => {
    fetch('/api/application/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, releaseName }),
    });
};
