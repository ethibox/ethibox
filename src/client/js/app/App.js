import React from 'react';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import { isConnect } from '../utils';
import Register from '../user/Register';
import Login from '../user/Login';
import DashboardLayout from './DashboardLayout';
import Home from './Home';

export default () => {
    return (
        <Router>
            <Switch>
                <Route path="/" render={() => (isConnect() ? (<DashboardLayout><Home /></DashboardLayout>) : (<Login />))} exact />
                <Route path="/payment" render={() => (isConnect() ? (<DashboardLayout><Payment /></DashboardLayout>) : (<Login />))} exact />
                <Route path="/register" component={Register} />
                <Route path="/login" component={Login} />
                <Route path="/404" component={() => <div>Not found</div>} />
            </Switch>
        </Router>
    );
}
