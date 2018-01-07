export default (state = { applications: [], lastActionDate: Date.now() - 5000 }, action) => {
    switch (action.type) {
        case 'LIST_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications };
        }

        case 'INSTALL_APPLICATION_SUCCESS': {
            const newApplication = action.application;
            newApplication.state = 'loading';
            return { ...state, applications: [...state.applications, newApplication], lastActionDate: Date.now() };
        }

        case 'UNINSTALL_APPLICATION_SUCCESS': {
            return {
                ...state,
                applications: state.applications.map(app => (app.releaseName === action.releaseName ? { ...app, state: 'loading' } : app)),
                lastActionDate: Date.now(),
            };
        }

        default: {
            return state;
        }
    }
};
