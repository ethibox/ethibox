import React from 'react';
import { Header, Card } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';

export default () => {
    return [
        <Header as="h1" content="Applications" subheader="Liste des applications" key="title" />,
        <Card.Group itemsPerRow={4} key="apps" stackable>
            <ApplicationList />
            <ChartList />
        </Card.Group>,
    ];
};
