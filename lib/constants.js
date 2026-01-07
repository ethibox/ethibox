export const EMAIL_BLOCKLIST = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

export const TEMPLATES_URL = process.env.TEMPLATES_URL || 'https://raw.githubusercontent.com/ethibox/awesome-stacks/master/templates.json';

export const SOCKET_PATH = process.env.SOCKET_PATH || '/var/run/docker.sock';

export const STANDBY_TIMEOUT = 3 * 60 * 1000;

export const AUTO_UPGRADE = true;

export const DEFAULT_PRICE = 1900;

export const DEFAULT_CURRENCY = 'eur';

export const DEFAULT_INTERVAL = 'month';

export const DEFAULT_LOCALE = 'en';

export const LOCALES = ['en', 'fr'];

export const TEST_EMAIL = 'contact@ethibox.fr';

export const TEST_PASSWORD = atob('bXlwQHNzdzByZA==');

export const STATE = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    DELETED: 'deleted',
    STANDBY: 'standby',
    WAITING: 'waiting',
};

export const WEBHOOK_EVENTS = {
    APP_INSTALLED: 'app.installed',
    APP_UPDATED: 'app.updated',
    APP_UNINSTALLED: 'app.uninstalled',
    USER_REGISTERED: 'user.registered',
    PASSWORD_RESET_REQUESTED: 'password.reset_requested',
};

export const EXCLUDED_ENV_VARS = [
    'PORT',
    'JWT_SECRET',
    'DOCKER_HOST',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_TYPE',
    'DATABASE_PASSWORD',
    'DATABASE_USERNAME',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_SITE_URL',
];
