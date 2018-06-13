export default (state = { packages: [] }, action) => {
    switch (action.type) {
        case 'LOAD_PACKAGES': {
            return { ...state, ...action };
        }

        default: {
            return state;
        }
    }
};
