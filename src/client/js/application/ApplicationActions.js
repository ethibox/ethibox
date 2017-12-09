export const installApplication = application => ({ type: 'INSTALL_APPLICATION', application });
export const updateApplication = application => ({ type: 'UPDATE_APPLICATION', application });
export const uninstallApplication = id => ({ type: 'UNINSTALL_APPLICATION', id });
export const loadApplicationsSuccess = applications => ({ type: 'LOAD_APPLICATIONS_SUCCESS', applications });

export const loadApplications = () => (dispatch) => {
    fetch('/api/charts')
        .then(data => data.json())
        .then((apps) => {
            dispatch(loadApplicationsSuccess(apps));
        })
        .catch(console.log);
};
