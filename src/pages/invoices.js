import React from 'react';

import Layout from '../components/layout';
import InvoicesPanel from '../components/invoicesPanel';
import Loader from '../components/loaders/miniLoader';

export default () => {
    return (
        <Layout>
            <React.Suspense fallback={<Loader />}>
                <InvoicesPanel />
            </React.Suspense>
        </Layout>
    );
};
