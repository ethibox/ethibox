import React from 'react';
import { Segment, Container, Divider, Card, Button } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';
import Modal from '../modal/Modal';
import Loader from '../loader/Loader';
import Header from './Header';

const App = () => {
    return (
        <Container>
            <Divider hidden />
            <Header floated="left" />
            <Button basic floated="right" icon="sign out" content="Se déconnecter" onClick={() => { localStorage.clear(); window.location.replace('/'); }} />
            <Divider hidden clearing />

            <Card.Group itemsPerRow={4} stackable>
                <ApplicationList />
                <ChartList />
            </Card.Group>

            <Segment padded="very" textAlign="center" style={{ border: 0 }} vertical>
                <p>Made with <span style={{ color: 'red' }}>♥</span> by <a href="https://ston3o.me" rel="noopener noreferrer" target="_blank">ston3o</a> for the Open-Source Community - <a href="https://github.com/ston3o/ethibox/releases" rel="noopener noreferrer" target="_blank">Version { process.env.VERSION }</a></p>
            </Segment>

            <Modal />
            <Loader />
        </Container>
    );
};

export default App;
