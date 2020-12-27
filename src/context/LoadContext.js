import React, { useState, useEffect } from 'react';
import { withPrefix } from 'gatsby';
import { checkStatus, getToken } from '../utils';

const { Provider, Consumer } = React.createContext({ applications: [] });

const INTERVAL = process.env.NODE_ENV === 'production' ? 5000 : 2000;

const LoadProvider = (props) => {
    const { children } = props;

    const [applications, updateApplications] = useState([]);

    const loadData = () => {
        fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `{
                applications { name, releaseName, category, logo, task, state, error, domain }
            }` }),
        })
            .then(checkStatus)
            .then(({ data }) => {
                updateApplications(data.applications);
            });
    };

    useEffect(() => {
        loadData();
        const loadInterval = setInterval(loadData, INTERVAL);
        return () => clearInterval(loadInterval);
    }, []);

    return (
        <Provider value={{ applications }}>
            {children}
        </Provider>
    );
};

const withLoader = (Component) => (props) => (
    <Consumer>
        { ({ applications }) => (
            <Component {...props} applications={applications} />
        ) }
    </Consumer>
);

export {
    withLoader,
    LoadProvider,
    Consumer as LoadConsumer,
};
