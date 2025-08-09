export const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const STANDBY_TIMEOUT = 3 * 60 * 1000;

export const DEFAULT_PRICE = 1900;

export const DEFAULT_CURRENCY = 'eur';

export const DEFAULT_INTERVAL = 'month';

export const DEFAULT_LOCALE = 'en';

export const LOCALES = ['en', 'fr'];

export const STATE = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    DELETED: 'deleted',
    STANDBY: 'standby',
};

export const WEBHOOK_EVENTS = {
    APP_INSTALLED: 'app.installed',
    APP_UPDATED: 'app.updated',
    APP_UNINSTALLED: 'app.uninstalled',
    USER_REGISTERED: 'user.registered',
    PASSWORD_RESET_REQUESTED: 'password.reset_requested',
};
