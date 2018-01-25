import React from 'react';
import { Message } from 'semantic-ui-react';

export default () => {
    return (
        <Message info>
            <Message.Header>Information</Message.Header>
            <p>This is a <b>demo</b> instance, applications will be removed frequently.</p>
        </Message>
    );
};
