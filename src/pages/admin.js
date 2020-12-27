import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';

import Layout from '../components/layout';
import Loader from '../components/loaders/panelLoader';
import AdminSettings from '../components/adminSettings';

export default () => {
    const intl = useIntl();

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{intl.formatMessage({ id: 'Administration' })}</h1>
            </div>

            <React.Suspense fallback={<Loader />}>
                <AdminSettings />
            </React.Suspense>
        </Layout>
    );
};
