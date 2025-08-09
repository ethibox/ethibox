import path from 'path';
import { DEFAULT_LOCALE, LOCALES } from './lib/constants.js';

const config = {
    i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: LOCALES,
    },
    defaultNS: 'common',
    localePath: path.resolve('./public/locales'),
};

export default config;
