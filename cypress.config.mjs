import jwt from 'jsonwebtoken';
import { defineConfig } from 'cypress';

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
                'generate:jwt': () => {
                    const secret = process.env.JWT_SECRET || 'mys3cr3t';
                    const token = jwt.sign({ email: 'contact@ethibox.fr' }, secret, { expiresIn: '1d' });
                    return token;
                },
            });
        },
    },
});
