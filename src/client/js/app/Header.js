import React from 'react';
import { Header } from 'semantic-ui-react';
import logo from '../../images/logo.svg';

export default (props) => {
    return (
        <Header as="h1" floated={props.floated}>
            <img src={logo} alt="logo" />
            <Header.Content>
                Ethibox { props.demo && <small className="demo">demo</small> }
                <Header.Subheader>Host your websites effortlessly</Header.Subheader>
            </Header.Content>
        </Header>
    );
};
