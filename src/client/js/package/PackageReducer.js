export default (state = { packages: [] }, action) => {
    switch (action.type) {
        case 'LIST_PACKAGES': {
            return { ...state, ...action };
        }

        default: {
            return state;
        }
    }
};
