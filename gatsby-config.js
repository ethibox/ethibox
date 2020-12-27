const proxy = require('http-proxy-middleware');

require('dotenv').config({ path: '.env' });

const config = {
    siteMetadata: {
        title: 'Ethibox',
        description: 'Open-source web apps hoster',
        author: '@ethibox',
    },
    pathPrefix: '/app',
    plugins: [
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'images',
                path: `${__dirname}/src/images`,
            },
        },
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: 'gatsby-starter-default',
                short_name: 'starter',
                start_url: '/',
                background_color: '#00AAAA',
                theme_color: '#00AAAA',
                display: 'minimal-ui',
                icon: 'src/images/favicon.png',
            },
        },
        {
            resolve: 'gatsby-plugin-sass',
            options: {
                postCssPlugins: [
                    require('tailwindcss'), // eslint-disable-line
                    require('./tailwind.config.js'), // eslint-disable-line
                ],
            },
        },
        {
            resolve: 'gatsby-plugin-intl',
            options: {
                path: `${__dirname}/src/intl`,
                languages: ['en', 'fr'],
                defaultLanguage: process.env.NODE_ENV === 'production' ? 'fr' : 'en',
            },
        },
        {
            resolve: 'gatsby-plugin-react-svg',
            options: {
                rule: {
                    include: /images/,
                },
            },
        },
        {
            resolve: 'gatsby-plugin-purgecss',
            options: {
                tailwind: true,
            },
        },
        'gatsby-transformer-sharp',
        'gatsby-plugin-sharp',
        'gatsby-plugin-react-helmet',
    ],
    developMiddleware: (app) => {
        app.use(['/graphql', '/ethibox.js'], proxy({ target: 'http://localhost:3000' }));
    },
    flags: {
        QUERY_ON_DEMAND: false,
        LAZY_IMAGES: false,
    },
};

if (process.env.MATOMO_ENABLED === 'true') {
    config.plugins.push({
        resolve: 'gatsby-plugin-matomo',
        options: {
            siteId: process.env.MATOMO_SITEID,
            matomoUrl: process.env.MATOMO_URL,
            trackLoad: false,
            dev: process.env.NODE_ENV === 'development',
        },
    });
}

module.exports = config;
