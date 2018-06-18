import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Icon, Button, Header, Container, Grid } from 'semantic-ui-react';
import Application from './Application';

const Empty = () => {
    return (
        <Container style={{ height: '100%' }}>
            <Grid verticalAlign="middle" style={{ height: '100%' }} centered stackable>
                <Grid.Column textAlign="center" style={{ maxWidth: 450 }}>
                    <Header as="h1" color="grey" icon>
                        <Icon name="cube" size="massive" />
                        No applications
                        <Header.Subheader>Start installing your applications in one click.</Header.Subheader>
                        <Link to="/store" href="/store">
                            <Button style={{ marginTop: 20 }} color="teal">Install application</Button>
                        </Link>
                    </Header>
                </Grid.Column>
            </Grid>
        </Container>
    );
};

const ApplicationList = (props) => {
    const applications = props.applications.sort((a, b) => a.releaseName.localeCompare(b.releaseName));
    return applications.length ?
        <Card.Group itemsPerRow={4} stackable>{applications.map(app => <Application {...app} key={app.releaseName} />)}</Card.Group>
        : <Empty />;
};

ApplicationList.defaultProps = { applications: [] };
const mapStateToProps = state => ({ ...state.ApplicationReducer });

export default connect(mapStateToProps)(ApplicationList);
