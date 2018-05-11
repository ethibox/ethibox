import React from 'react';
import { connect } from 'react-redux';
import Package from './Package';

const PackageList = (props) => {
    const packages = props.packages.sort((a, b) => a.name.localeCompare(b.name));
    return packages.length ? packages.map(pkg => <Package {...pkg} key={pkg.name} />) : null;
};

PackageList.defaultProps = { packages: [] };
const mapStateToProps = state => ({ ...state.PackageReducer });

export default connect(mapStateToProps)(PackageList);
