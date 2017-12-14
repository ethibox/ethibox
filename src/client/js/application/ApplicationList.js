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
        return this.props.applications.map(app => <Application {...app} key={app.releaseName} />);
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ listApplications }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ApplicationList);
