module.exports = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    trailingSlash: !!process.env.NEXT_PUBLIC_BASE_PATH,
    i18n: {
        defaultLocale: 'fr',
        locales: ['fr', 'en'],
    },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
    module.exports,
    {
        silent: true,
        org: 'ethibox',
        project: 'ethibox',
        url: 'https://glitchtip.ethibox.fr/',
    },
    {
        widenClientFileUpload: true,
        transpileClientSDK: true,
        tunnelRoute: '/monitoring',
        hideSourceMaps: true,
        disableLogger: true,
        automaticVercelMonitors: true,
    },
);
