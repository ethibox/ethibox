import jwt from 'jsonwebtoken';
import { defineConfig } from 'cypress';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    e2e: {
        video: false,
        baseUrl: 'http://localhost:3000',
        specPattern: '__tests__/e2e/*.spec.js',
        supportFile: '__tests__/e2e/commands.js',
        screenshotOnRunFailure: process.env.GITHUB_ACTIONS === 'true',
        setupNodeEvents(on) {
            on('task', {
                'generate:jwt': () => jwt.sign({ email: 'contact@ethibox.fr' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
            });
        },
    },
});
