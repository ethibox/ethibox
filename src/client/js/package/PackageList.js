import React from 'react';
import { Card, Container, Grid, Header, Icon } from 'semantic-ui-react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import { faStoreAlt } from '@fortawesome/fontawesome-free-solid';
import { connect } from 'react-redux';
import Package from './Package';

const Empty = () => {
    return (
        <Container style={{ height: '100%' }}>
            <Grid verticalAlign="middle" style={{ height: '100%' }} centered stackable>
                <Grid.Column textAlign="center" style={{ maxWidth: 450 }}>
                    <Header as="h1" color="grey" icon>
                        <Icon as={FontAwesomeIcon} icon={faStoreAlt} width="150" />
                        Store is empty
                    </Header>
                </Grid.Column>
            </Grid>
        </Container>
    );
};

const PackageList = (props) => {
    const packages = props.packages.sort((a, b) => a.name.localeCompare(b.name));

    if (!packages.length) {
        return <Empty />;
    }

    return (
        <Card.Group itemsPerRow={4} stackable>
            { packages.length ? packages.map(pkg => <Package {...pkg} key={pkg.name} />) : null }
        </Card.Group>
    );
};

PackageList.defaultProps = { packages: [] };
const mapStateToProps = state => ({ ...state.PackageReducer });

export default connect(mapStateToProps)(PackageList);
