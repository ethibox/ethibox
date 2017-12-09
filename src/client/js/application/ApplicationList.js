import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Application from './Application';
import { loadApplications } from './ApplicationActions';

class ApplicationList extends React.Component {
    componentWillMount() {
        this.props.loadApplications();
    }

    render() {
        return [
            this.props.applications.filter(app => app.installed).map(app => <Application {...app} key={app.name} />),
            this.props.applications.filter(app => !app.installed).map(app => <Application {...app} key={app.name} />),
        ];
    }
}

const mapStateToProps = (state) => {
    const { applications } = state.AppReducer;
    const { category, search } = state.SidebarReducer;

    if (category !== 'All') {
        return { applications: applications.filter(app => app.category === category) };
    }

    const regexp = new RegExp(search, 'gi');
    const applicationsFiltered = applications.filter(app => regexp.test(app.name) || regexp.test(app.domain));

    return { applications: applicationsFiltered };
};

const mapDispatchToProps = dispatch => bindActionCreators({ loadApplications }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ApplicationList);
