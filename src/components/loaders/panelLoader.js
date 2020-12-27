import React from 'react';
import { withPrefix } from 'gatsby';
import { useIntl } from 'gatsby-plugin-intl';

export default () => {
    const intl = useIntl();

    return (
        <div className="my-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="flex flex-col text-center items-center p-12">
                        <img src={`${withPrefix('/spinner-black.svg')}`} className="spinner w-8 mr-4" alt="spinner" />
                        {intl.formatMessage({ id: 'Loading...' })}
                    </div>
                </div>
            </div>
        </div>
    );
};
