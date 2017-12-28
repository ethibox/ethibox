export default (state = { charts: [], isLoading: false }, action) => {
    switch (action.type) {
        case 'LIST_CHARTS_LOADING': {
            return { ...state, isLoading: action.isLoading };
        }

        case 'LIST_CHARTS_SUCCESS': {
            return { ...state, charts: action.charts, isLoading: false };
        }

        default: {
            return state;
        }
    }
};
