import { STATES } from '../utils';

export default (state = { applications: [] }, action) => {
    localStorage.setItem('lastActionDate', Date.now());

    switch (action.type) {
        case 'LOAD_APPLICATIONS': {
            return { ...state, applications: action.applications || [] };
        }

        case 'INSTALL_APPLICATION_SUCCESS': {
            const newApplication = action.application;
            newApplication.state = STATES.INSTALLING;
            return { ...state, applications: [...state.applications, newApplication] };
        }

        case 'EDIT_APPLICATION_SUCCESS': {
            return { ...state, applications: state.applications.map(app => (app.releaseName === action.releaseName ? { ...app, state: STATES.EDITING } : app)) };
        }

        case 'UNINSTALL_APPLICATION_SUCCESS': {
            if (action.force) {
                return { ...state, applications: state.applications.filter(app => app.releaseName !== action.releaseName) };
            }
            return { ...state, applications: state.applications.map(app => (app.releaseName === action.releaseName ? { ...app, state: STATES.UNINSTALLING } : app)) };
        }

        default: {
            return state;
        }
    }
};
