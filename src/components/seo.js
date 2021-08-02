import React from 'react';
import Helmet from 'react-helmet';
import { useStaticQuery, graphql } from 'gatsby';

export default ({ title, description, meta = [] }) => {
    const { site } = useStaticQuery(graphql`
        query {
            site {
                siteMetadata {
                    title
                    description
                }
            }
        }
    `);

    const defaultTitle = site.siteMetadata?.title;
    const defaultDescription = site.siteMetadata?.description;

    return (
        <Helmet
            title={title || defaultTitle}
            meta={[
                {
                    name: 'description',
                    content: description || defaultDescription,
                },
            ].concat(meta)}
        />
    );
};
