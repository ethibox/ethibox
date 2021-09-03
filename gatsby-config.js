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
            resolve: 'gatsby-plugin-intl',
            options: {
                path: `${__dirname}/src/intl`,
                languages: ['en', 'fr'],
                defaultLanguage: 'en',
                redirect: true,
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
        app.use(['/graphql', '/metrics', '/ethibox.js'], proxy({ target: 'http://localhost:3000' }));
    },
    flags: {
        QUERY_ON_DEMAND: false,
        LAZY_IMAGES: false,
    },
};

if (process.env.POSTHOG_ENABLED === 'true') {
    config.plugins.push({
        resolve: 'gatsby-plugin-posthog',
        options: {
            apiKey: process.env.POSTHOG_APIKEY,
            apiHost: process.env.POSTHOG_URL,
            head: true,
            isEnabledDevMode: false,
        },
    });
}

module.exports = config;
