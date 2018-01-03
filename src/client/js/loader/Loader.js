import React from 'react';
import { connect } from 'react-redux';
import { Dimmer, Loader } from 'semantic-ui-react';

const LoaderComponent = (props) => {
    return (
        <Dimmer active={props.isOpen}>
            <Loader size="massive">Loading...</Loader>
        </Dimmer>
    );
};

const mapStateToProps = state => ({ ...state.LoaderReducer });

export default connect(mapStateToProps)(LoaderComponent);
