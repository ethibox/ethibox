export default (state = {}, action) => {
    switch (action.type) {
        case 'REGISTER_SUCCESS': {
            localStorage.setItem('token', action.token);
            return { ...state, error: null };
        }

        case 'REGISTER_FAILURE': {
            return { ...state, error: action.error };
        }

        default: {
            return state;
        }
    }
};
