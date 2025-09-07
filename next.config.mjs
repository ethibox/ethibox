import crypto from 'crypto';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/constants.js';
import { withSentryConfig } from '@sentry/nextjs';
import { startCron } from './lib/cron.js';
import { NEXT_PUBLIC_BASE_PATH } from './lib/constants.js';
import nextI18nextConfig from './next-i18next.config.mjs';

const { i18n } = nextI18nextConfig;

const config = (phase) => {
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    }

    if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER) {
        startCron();
    }

    return {
        i18n,
        devIndicators: false,
        basePath: NEXT_PUBLIC_BASE_PATH,
        trailingSlash: !!NEXT_PUBLIC_BASE_PATH,
    };
};

export default withSentryConfig(config, {
    org: 'ethibox',
    project: 'ethibox',
    sentryUrl: 'https://glitchtip.ethibox.fr/',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
    automaticVercelMonitors: true,
});
