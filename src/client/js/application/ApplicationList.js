import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import socketIOClient from 'socket.io-client';
import Application from './Application';
import { listApplications, listApplicationsSuccess } from './ApplicationActions';
import { openLoader, closeLoader } from '../loader/LoaderActions';

const endpoint = `//${window.location.host}`;

class ApplicationList extends React.Component {
    componentWillMount() {
        this.props.openLoader('Loading applications...');
        const socket = socketIOClient(endpoint);
        socket.on('listApplications', (apps) => {
            this.props.closeLoader();
            if (this.props.lastActionDate < Date.now() - 5000) {
                this.props.listApplicationsSuccess(apps);
            }
        });
    }

    render() {
        const applications = this.props.applications.sort((a, b) => a.releaseName.localeCompare(b.releaseName));
        return applications.length ? applications.map(app => <Application {...app} key={app.releaseName} />) : null;
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ listApplications, listApplicationsSuccess, openLoader, closeLoader }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ApplicationList);
