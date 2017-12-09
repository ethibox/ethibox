import React from 'react';
import { Button, Container, Divider, Header, Icon, Card, Grid } from 'semantic-ui-react';
import Sidebar from '../sidebar/Sidebar';
import ApplicationList from '../application/ApplicationList';

const App = () => {
    return (
        <Container>
            <Divider hidden />

            <Header as="h1" floated="left">
                <Icon color="teal" name="cloud" />
                <Header.Content>
                    Ethibox
                    <Header.Subheader>The new way to host websites</Header.Subheader>
                </Header.Content>
            </Header>

            <Button basic floated="right" icon="sign out" content="Se déconnecter" href="/logout" />

            <Divider hidden clearing />

            <Grid columns={2}>
                <Grid.Row>
                    <Grid.Column computer={3}>
                        <Sidebar />
                    </Grid.Column>

                    <Grid.Column computer={13}>
                        <Card.Group itemsPerRow={4}>
                            <ApplicationList />
                        </Card.Group>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Container>
    );
};

export default App;
