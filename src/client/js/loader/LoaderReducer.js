const initialState = { isOpen: false, loadingMessage: '' };

export default (state = initialState, action) => {
    switch (action.type) {
        case 'OPEN_LOADER': {
            return { ...state, isOpen: true, loadingMessage: action.loadingMessage };
        }

        case 'CLOSE_LOADER': {
            return initialState;
        }

        default: {
            return state;
        }
    }
};
