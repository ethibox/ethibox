export const listChartsSuccess = charts => ({ type: 'LIST_CHARTS_SUCCESS', charts });
export const listChartsLoading = bool => ({ type: 'LIST_CHARTS_LOADING', isLoading: bool });

export const listCharts = () => (dispatch) => {
    dispatch(listChartsLoading(true));

    fetch('/api/charts')
        .then(data => data.json())
        .then(charts => dispatch(listChartsSuccess(charts)));
};
