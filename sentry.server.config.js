import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: 'https://780ad3ea6f3246649198ce9eb00cdda5@glitchtip.ethibox.fr/1',
    tracesSampleRate: 1,
    debug: false,
});