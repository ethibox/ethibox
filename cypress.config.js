require('dotenv/config');
const { defineConfig } = require('cypress');
const { resetDatabase, initDatabase } = require('./lib/utils.cjs')('./orm.js');
const { resetStripe } = require('./lib/utils.cjs')('./stripe.js');

module.exports = defineConfig({
    chromeWebSecurity: false,
    e2e: {
        fixturesFolder: false,
        specPattern: '__tests__/e2e/*.spec.js',
        supportFile: false,
        screenshotOnRunFailure: false,
        trashAssetsBeforeRuns: false,
        video: false,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        baseUrl: 'http://localhost:3000',
        env: {
            JWT_SECRET: process.env.JWT_SECRET,
            CI: process.env.CI,
        },
        retries: {
            runMode: 2,
            openMode: 0,
        },
        setupNodeEvents(on) {
            on('task', {
                'stripe:reset': async () => {
                    await resetStripe();
                    return null;
                },
                'db:reset': async () => {
                    await resetDatabase();
                    return null;
                },
                'db:seed': async () => {
                    await initDatabase();
                    return null;
                },
            });
        },
    },
});
