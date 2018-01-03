import React from 'react';
import Chart from './Chart';

const ChartList = () => {
    const charts = process.env.CHARTS;
    return charts.map(chart => <Chart {...chart} key={chart.name} />);
};

export default ChartList;
