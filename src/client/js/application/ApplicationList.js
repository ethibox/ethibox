import React from 'react';
import { connect } from 'react-redux';
import Application from './Application';

const ApplicationList = (props) => {
    const applications = props.applications.sort((a, b) => a.releaseName.localeCompare(b.releaseName));
    return applications.length ? applications.map(app => <Application {...app} key={app.releaseName} />) : null;
};

ApplicationList.defaultProps = { applications: [] };
const mapStateToProps = state => ({ ...state.ApplicationReducer });

export default connect(mapStateToProps)(ApplicationList);
