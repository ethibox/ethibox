export default (state = { applications: [] }, action) => {
    switch (action.type) {
        case 'LIST_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications };
        }

        case 'INSTALL_APPLICATION_SUCCESS': {
            const newApplication = action.application;
            newApplication.state = 'loading';
            localStorage.setItem('lastActionDate', Date.now());
            return { ...state, applications: [...state.applications, newApplication] };
        }

        case 'UNINSTALL_APPLICATION_SUCCESS': {
            localStorage.setItem('lastActionDate', Date.now());
            if (action.force) {
                return { ...state, applications: state.applications.filter(app => app.releaseName !== action.releaseName) };
            }
            return { ...state, applications: state.applications.map(app => (app.releaseName === action.releaseName ? { ...app, state: 'loading' } : app)) };
        }

        default: {
            return state;
        }
    }
};
