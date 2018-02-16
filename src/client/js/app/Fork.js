import React from 'react';
import forkMe from '../../images/fork-me.png';

export default () => {
    return (
        <a href="https://github.com/ston3o/ethibox" target="_blank" rel="noopener noreferrer" className="fork">
            <img style={{ position: 'absolute', top: 0, right: 0, border: 0, zIndex: 100 }} src={forkMe} alt="fork-me" />
        </a>
    );
};
