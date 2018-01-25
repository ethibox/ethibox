import React from 'react';
import { Container, Divider, Card, Button } from 'semantic-ui-react';
import ApplicationList from '../application/ApplicationList';
import ChartList from '../chart/ChartList';
import MessageDemo from './MessageDemo';
import Modal from '../modal/Modal';
import Loader from '../loader/Loader';
import Header from './Header';
import Footer from './Footer';
import Fork from './Fork';

const App = () => {
    return (
        <Container>
            <Divider hidden />
            <Fork />
            <Header floated="left" />
            <Button basic floated="right" icon="sign out" content="Se déconnecter" onClick={() => { localStorage.clear(); window.location.replace('/'); }} />
            <Divider hidden clearing />

            { process.env.DEMO && <MessageDemo /> }

            <Card.Group itemsPerRow={4} stackable>
                <ApplicationList />
                <ChartList />
            </Card.Group>

            <Footer version />

            <Modal />
            <Loader />
        </Container>
    );
};

export default App;
