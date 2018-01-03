export const listChartsSuccess = charts => ({ type: 'LIST_CHARTS_SUCCESS', charts });

export const listCharts = () => (dispatch) => {
    fetch('/api/charts')
        .then(data => data.json())
        .then(charts => dispatch(listChartsSuccess(charts)));
};
