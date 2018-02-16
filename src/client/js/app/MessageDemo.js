import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';

class MessageDemo extends Component {
    state = { visible: true }

    handleDismiss = () => this.setState({ visible: !this.state.visible })

    render() {
        return (
            <Message onDismiss={this.handleDismiss} hidden={!this.state.visible} info>
                <Message.Header>Information</Message.Header>
                <p>This is a <b>demo</b> instance, applications will be removed frequently.</p>
            </Message>
        );
    }
}

export default MessageDemo;
