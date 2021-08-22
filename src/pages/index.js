import React from 'react';

import Layout from '../components/layout';
import TemplatesPanel from '../components/templatesPanel';
import Loader from '../components/loaders/miniLoader';

const Index = () => {
    return (
        <Layout>
            <React.Suspense fallback={<Loader />}>
                <TemplatesPanel />
            </React.Suspense>
        </Layout>
    );
};

export default Index;
