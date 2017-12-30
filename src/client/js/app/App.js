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
                <Header.Content>
                    Ethibox
                    <Header.Subheader>Let&apos;s decentralize the internet!</Header.Subheader>
                </Header.Content>
                <a href="https://github.com/ston3o/ethibox" target="_blank" rel="noopener noreferrer">
                    <img style={{ position: 'absolute', top: 0, right: 0, border: 0 }} src="https://frama.link/fork-me" alt="Fork me on GitHub" data-canonical-src="https://frama.link/wKZ3Ly2G" />
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
