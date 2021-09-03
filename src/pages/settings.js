import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';

import Layout from '../components/layout';
import Loader from '../components/loaders/panelLoader';
import SettingsPanel from '../components/settingsPanel';

const Settings = () => {
    const intl = useIntl();

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{intl.formatMessage({ id: 'Settings' })}</h1>
            </div>

            <React.Suspense fallback={<Loader />}>
                <SettingsPanel />
            </React.Suspense>
        </Layout>
    );
};

export default Settings;
