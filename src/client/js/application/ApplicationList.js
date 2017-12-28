import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Application from './Application';
import { listApplications } from './ApplicationActions';

class ApplicationList extends React.Component {
    componentWillMount() {
        this.props.listApplications();
    }

    render() {
        const { applications } = this.props;
        return applications.length ? applications.map(app => <Application {...app} key={app.releaseName} />) : null;
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ listApplications }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ApplicationList);
