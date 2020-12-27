import React from 'react';
import { withPrefix } from 'gatsby';
import { useIntl } from 'gatsby-plugin-intl';

export default () => {
    const intl = useIntl();

    return (
        <div className="min-h-full flex items-center justify-center">
            <div className="flex flex-col text-center items-center p-12">
                <img src={`${withPrefix('/spinner-black.svg')}`} className="spinner w-8 mr-4" alt="spinner" />
                {intl.formatMessage({ id: 'Loading...' })}
            </div>
        </div>
    );
};
