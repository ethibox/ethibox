export default (state = { isSynchronized: false }, action) => {
    localStorage.setItem('lastActionDate', Date.now());

    switch (action.type) {
        case 'SYNCHRONIZE_SUCCESS': {
            return { ...state, isSynchronized: true };
        }

        default: {
            return state;
        }
    }
};
