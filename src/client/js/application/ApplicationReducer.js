export default (state = { applications: [], isLoading: false }, action) => {
    switch (action.type) {
        case 'LIST_APPLICATIONS_SUCCESS': {
            return { ...state, applications: action.applications };
        }

        case 'ADD_APPLICATION': {
            return { ...state, applications: [...state.applications, action.application] };
        }

        case 'REMOVE_APPLICATION': {
            return { ...state, applications: state.applications.filter(app => app.releaseName !== action.releaseName) };
        }

        default: {
            return state;
        }
    }
};
