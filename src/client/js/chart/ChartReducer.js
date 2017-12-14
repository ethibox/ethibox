export default (state = { charts: [] }, action) => {
    switch (action.type) {
        case 'LIST_CHARTS_SUCCESS': {
            return { ...state, charts: action.charts };
        }

        default: {
            return state;
        }
    }
};
