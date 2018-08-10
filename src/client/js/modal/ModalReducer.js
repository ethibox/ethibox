const initialState = { isOpen: false, hasErrored: false, title: '', errorMessage: '', successMessage: '', redirectUrl: '' };

export default (state = initialState, action) => {
    switch (action.type) {
        case 'OPEN_MODAL': {
            return { ...state, isOpen: true, ...action.params };
        }

        case 'CLOSE_MODAL': {
            return { ...state, isOpen: false, ...initialState };
        }

        default: {
            return state;
        }
    }
};
