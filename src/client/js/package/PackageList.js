import React from 'react';
import { Card } from 'semantic-ui-react';
import { connect } from 'react-redux';
import Package from './Package';

const PackageList = (props) => {
    const packages = props.packages.sort((a, b) => a.name.localeCompare(b.name));
    return (
        <Card.Group itemsPerRow={4} stackable>
            { packages.length ? packages.map(pkg => <Package {...pkg} key={pkg.name} />) : null }
        </Card.Group>
    );
};

PackageList.defaultProps = { packages: [] };
const mapStateToProps = state => ({ ...state.PackageReducer });

export default connect(mapStateToProps)(PackageList);
