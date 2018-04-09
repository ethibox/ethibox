export default (state = {}, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS': {
            localStorage.setItem('token', action.token);
            return { ...state, error: null };
        }

        case 'LOGIN_FAILURE': {
            return { ...state, error: action.error };
        }

        default: {
            return state;
        }
    }
};
