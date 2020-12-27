import React from 'react';

import Layout from '../components/layout';
import AppsPanel from '../components/appsPanel';
import Loader from '../components/loaders/miniLoader';

export default () => {
    return (
        <Layout>
            <React.Suspense fallback={<Loader />}>
                <AppsPanel />
            </React.Suspense>
        </Layout>
    );
};
