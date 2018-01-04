import React from 'react';
import { Segment, Container, Divider, Header, Card } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';
import Modal from '../modal/Modal';
import Loader from '../loader/Loader';
import logo from '../../images/logo.svg';
import fork from '../../images/fork-me.png';

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
                    <img style={{ position: 'absolute', top: 0, right: 0, border: 0 }} src={fork} alt="Fork me on GitHub" />
                </a>
            </Header>

            <Divider hidden clearing />

            <Card.Group itemsPerRow={4} stackable>
                <ApplicationList />
                <ChartList />
            </Card.Group>

            <Segment padded="very" vertical textAlign="center" style={{ border: 0 }}>
                Made with <span style={{ color: 'red' }}>♥</span> by <a href="https://ston3o.me" rel="noopener noreferrer" target="_blank">ston3o</a>
            </Segment>

            <Modal />
            <Loader />
        </Container>
    );
};

export default App;
