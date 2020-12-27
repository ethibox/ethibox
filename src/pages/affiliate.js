import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';
import Construction from '../images/construction.svg';

import Layout from '../components/layout';

export default () => {
    const intl = useIntl();

    return (
        <Layout>
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col justify-center">
                    <Construction className="w-24 m-auto" fill="gray" />
                    <h4 className="text-center text-2xl">{intl.formatMessage({ id: 'Coming soon' })}...</h4>
                </div>
            </div>
        </Layout>
    );
};
