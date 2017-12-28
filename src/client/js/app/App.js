import React from 'react';
import { Container, Divider, Header, Card } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';
import Modal from '../modal/Modal';
import logo from '../../images/logo.svg';

const App = () => {
    return (
        <Container>
            <Divider hidden />

            <Header as="h1">
                <img src={logo} alt="logo" />
                <Header.Content>Ethibox</Header.Content>
                <a href="https://github.com/ston3o/ethibox" target="_blank" rel="noopener noreferrer">
                    <img style={{ position: 'absolute', top: 0, right: 0, border: 0 }} src="http://bit.ly/2Cci7hn" alt="Fork me on GitHub" data-canonical-src="http://bit.ly/2Cdw7aQ" />
                </a>
            </Header>

            <Divider hidden clearing />

            <Card.Group itemsPerRow={4} stackable>
                <ApplicationList />
                <ChartList />
            </Card.Group>
            <Modal />
        </Container>
    );
};

export default App;
