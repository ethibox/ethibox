export default (state = { applications: [], isLoading: false, hasErrored: false }, action) => {
    switch (action.type) {
        case 'LIST_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications, isLoading: false };
        }

        case 'LIST_APPLICATIONS_HAS_ERRORED': {
            return { ...state, hasErrored: action.hasErrored, isLoading: false };
        }

        case 'LIST_APPLICATIONS_LOADING': {
            return { ...state, isLoading: true };
        }

        case 'INSTALL_APPLICATION_SUCCESS': {
            const newApplication = action.application;
            newApplication.state = 'loading';
            return { ...state, applications: [...state.applications, newApplication], isLoading: false };
        }

        case 'INSTALL_APPLICATION_HAS_ERRORED': {
            return { ...state, hasErrored: action.hasErrored, isLoading: false };
        }

        case 'INSTALL_APPLICATION_LOADING': {
            return { ...state, isLoading: action.isLoading };
        }

        case 'UNINSTALL_APPLICATION_SUCCESS': {
            return { ...state, applications: state.applications.filter(app => app.releaseName !== action.releaseName), isLoading: false };
        }

        case 'UNINSTALL_APPLICATION_HAS_ERRORED': {
            return { ...state, hasErrored: action.hasErrored, isLoading: false };
        }

        case 'UNINSTALL_APPLICATION_LOADING': {
            return { ...state, isLoading: true };
        }

        case 'CLOSE_MODAL': {
            return { ...state, hasErrored: false };
        }

        default: {
            return state;
        }
    }
};
