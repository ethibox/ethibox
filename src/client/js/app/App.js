import React from 'react';
import { Container, Divider, Header, Icon, Card } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';

const App = () => {
    return (
        <Container>
            <Divider hidden />

            <Header as="h1">
                <Icon color="teal" name="cloud" />
                <Header.Content>Ethibox</Header.Content>
            </Header>

            <Divider hidden clearing />

            <Card.Group itemsPerRow={4} stackable>
                <ApplicationList />
                <ChartList />
            </Card.Group>
        </Container>
    );
};

export default App;
