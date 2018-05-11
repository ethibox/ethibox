const initialState = { isOpen: false, hasErrored: false, title: '', errorMessage: '', successMessage: '', redirect: false };

export default (state = initialState, action) => {
    switch (action.type) {
        case 'OPEN_MODAL': {
            return { ...state, isOpen: true, ...action.params };
        }

        case 'CLOSE_MODAL': {
            if (action.params && action.params.redirect) {
                localStorage.clear();
                window.location.replace('/');
            }
            return initialState;
        }

        default: {
            return state;
        }
    }
};
