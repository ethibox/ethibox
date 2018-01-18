import React from 'react';
import { Segment } from 'semantic-ui-react';

export default (props) => {
    return (
        <Segment padded="very" textAlign="center" style={{ border: 0 }} vertical>
            <p>
                Made with <span style={{ color: 'red' }}>♥</span> by&nbsp;
                <a href="https://ston3o.me" rel="noopener noreferrer" target="_blank">ston3o</a> for the Open-Source Community
                { props.version &&
                    <span> - <a href="https://github.com/ston3o/ethibox/releases" rel="noopener noreferrer" target="_blank">Version { process.env.VERSION }</a></span>
                }
            </p>
        </Segment>
    );
};
