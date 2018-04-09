import React from 'react';
import { Switch, Router, Route } from 'react-router-dom';
import { Redirect } from 'react-router';
import { isConnect, history } from '../utils';
import Register from '../register/Register';
import Login from '../login/Login';
import Subscribe from '../subscribe/Subscribe';
import Settings from '../settings/Settings';
import Layout from './Layout';
import ApplicationList from '../application/ApplicationList';
import PackageList from '../package/PackageList';

export default () => {
    return (
        <Router history={history}>
            <Switch>
                <Route path="/" render={() => (isConnect() ? (<Layout><ApplicationList /></Layout>) : (<Redirect to="/login" />))} exact />
                <Route path="/store" render={() => (isConnect() ? (<Layout><PackageList /></Layout>) : (<Redirect to="/login" />))} exact />
                <Route path="/subscribe" render={() => (isConnect() ? (<Layout><Subscribe /></Layout>) : (<Redirect to="/login" />))} exact />
                <Route path="/settings" render={() => (isConnect() ? (<Layout><Settings /></Layout>) : (<Redirect to="/login" />))} exact />
                <Route path="/logout" component={() => { localStorage.clear(); return <Redirect to="/login" />; }} exact />
                <Route path="/register" component={Register} />
                <Route path="/login" component={Login} />
                <Route component={() => <div>Not found</div>} />
            </Switch>
        </Router>
    );
};
