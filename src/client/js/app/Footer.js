import React from 'react';
import { Segment } from 'semantic-ui-react';

export default () => {
    return (
        <Segment padded="very" textAlign="center" style={{ fontSize: 12, border: 0 }} vertical>
            <p style={{ margin: 0 }}>
                Made with <span style={{ color: 'red' }}>♥</span> by&nbsp;
                <a href="https://ston3o.me" rel="noopener noreferrer" target="_blank">ston3o</a>
                <span> - Version { process.env.VERSION }</span>
            </p>
            <p style={{ margin: 0 }}>
                <a href="https://github.com/ethibox/ethibox" target="_blank" rel="noopener noreferrer">Source code</a> |&nbsp;
                <a href="https://github.com/ethibox/ethibox/issues" target="_blank" rel="noopener noreferrer">Issue tracker</a> |&nbsp;
                <a href="https://liberapay.com/ston3o/donate" target="_blank" rel="noopener noreferrer">Support</a>
            </p>
        </Segment>
    );
};
