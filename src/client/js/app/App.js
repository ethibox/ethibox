import React from 'react';
import { Button, Container, Divider, Header, Icon, Card, Grid } from 'semantic-ui-react';
import { connect } from 'react-redux';
import Sidebar from '../sidebar/Sidebar';
import Application from '../application/Application';

const App = (props) => {
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
                            { props.applications.filter(app => app.installed).map(app => <Application {...app} key={app.id} />) }
                            { props.applications.filter(app => !app.installed).map(app => <Application {...app} key={app.id} />) }
                        </Card.Group>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Container>
    );
};

const mapStateToProps = (state) => {
    const { applications } = state.AppReducer;
    const { category, search } = state.SidebarReducer;

    if (category !== 'All') {
        return { applications: applications.filter(app => app.category === category) };
    }

    const regexp = new RegExp(search, 'gi');
    const applicationsFiltered = applications.filter(app => regexp.test(app.name) || regexp.test(app.domain));

    return { applications: applicationsFiltered };
};

export default connect(mapStateToProps)(App);
