export default (state = { applications: [], isLoading: false }, action) => {
    switch (action.type) {
        case 'LOAD_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications };
        }

        case 'INSTALL_APPLICATION': {
            const newId = state.applications.reduce((maxId, app) => Math.max(app.id, maxId), -1) + 1;
            const newApplication = { id: newId, ...action.application };
            return { ...state, applications: [...state.applications, newApplication] };
        }

        case 'UPDATE_APPLICATION': {
            const applications = state.applications.map((app) => {
                if (app.id === action.application.id) {
                    return { ...app, ...action.application };
                }
                return app;
            });
            return { ...state, applications };
        }

        case 'UNINSTALL_APPLICATION': {
            return { ...state, applications: state.applications.filter(app => app.id !== action.id) };
        }

        default: {
            return state;
        }
    }
};
