import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { listCharts } from './ChartActions';
import Chart from './Chart';

class ChartList extends React.Component {
    componentWillMount() {
        this.props.listCharts();
    }

    render() {
        return this.props.charts.map(chart => <Chart {...chart} key={chart.name} />);
    }
}

const mapStateToProps = state => ({ ...state.ChartReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ listCharts }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ChartList);
