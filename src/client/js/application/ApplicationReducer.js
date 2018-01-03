export default (state = { applications: [], isLoading: false, hasErrored: false }, action) => {
    switch (action.type) {
        case 'LIST_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications, isLoading: false };
        }

        case 'INSTALL_APPLICATION_SUCCESS': {
            const newApplication = action.application;
            newApplication.state = 'loading';
            return { ...state, applications: [...state.applications, newApplication], isLoading: false };
        }

        case 'UNINSTALL_APPLICATION_SUCCESS': {
            return { ...state, applications: state.applications.filter(app => app.releaseName !== action.releaseName), isLoading: false };
        }

        default: {
            return state;
        }
    }
};
