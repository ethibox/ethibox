import React from 'react';
import Chart from './Chart';

export default () => process.env.CHARTS.map(chart => <Chart {...chart} key={chart.name} />);
