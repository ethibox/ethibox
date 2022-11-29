module.exports = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    trailingSlash: !!process.env.NEXT_PUBLIC_BASE_PATH,
    i18n: {
        defaultLocale: 'fr',
        locales: ['fr', 'en'],
    },
};
