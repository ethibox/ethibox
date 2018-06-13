export default (state = { error: null }, action) => {
    localStorage.setItem('lastActionDate', Date.now());

    switch (action.type) {
        case 'SUBSCRIBE_SUCCESS': {
            return { ...state, error: null };
        }

        case 'SUBSCRIBE_ERROR': {
            return { ...state, error: action.error };
        }

        default: {
            return state;
        }
    }
};
