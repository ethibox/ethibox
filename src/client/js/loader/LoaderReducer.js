export default (state = { isOpen: false }, action) => {
    switch (action.type) {
        case 'OPEN_LOADER': {
            return { ...state, isOpen: true };
        }

        case 'CLOSE_LOADER': {
            return { ...state, isOpen: false };
        }

        default: {
            return state;
        }
    }
};
