import fs from 'node:fs';
import crypto from 'node:crypto';
import { withSentryConfig } from '@sentry/nextjs';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/constants.js';
import { NEXT_PUBLIC_BASE_PATH, SOCKET_PATH } from './lib/constants.js';
import nextI18nextConfig from './next-i18next.config.mjs';
import { startCron } from './lib/cron.js';
import { init } from './lib/docker.js';

const { i18n } = nextI18nextConfig;

const config = (phase) => {
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    }

    if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER) {
        try {
            fs.accessSync(SOCKET_PATH, fs.constants.F_OK);
        } catch {
            console.error(`${SOCKET_PATH} not found.`); // eslint-disable-line no-console
            process.exit(1);
        }

        init();
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
    webpack: {
        treeshake: {
            removeDebugLogging: true,
        },
        automaticVercelMonitors: true,
    },
});
