import React from 'react';
import { Header } from 'semantic-ui-react';
import logo from '../../images/logo.svg';

export default (props) => {
    return (
        <Header as="h1" floated={props.floated}>
            <img src={logo} alt="logo" />
            <Header.Content>
                Ethibox
                <Header.Subheader>Let&apos;s decentralize internet!</Header.Subheader>
            </Header.Content>
        </Header>
    );
};
