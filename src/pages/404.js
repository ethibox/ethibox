import React from 'react';
import Helmet from 'react-helmet';
import { injectIntl, Link } from 'gatsby-plugin-intl';

import './404.scss';

export default injectIntl(({ intl }) => (
    <>
        <Helmet>
            <body id="notfound" />
        </Helmet>
        <main>
            <section>
                <span>404</span>
                <p>
                    {intl.formatMessage({ id: 'Page not found' })},{' '}
                    <Link to="/" className="underline font-bold">{intl.formatMessage({ id: 'click here to back to home' })}</Link>
                </p>
            </section>
        </main>
    </>
));
