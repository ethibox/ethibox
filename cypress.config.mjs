import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { defineConfig } from 'cypress';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

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
                'stripe:cancel-subscriptions': async () => {
                    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                    for await (const customer of stripe.customers.list({ email: 'contact@ethibox.fr' })) {
                        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 100 }).autoPagingToArray({ limit: 10000 });
                        await Promise.all(subscriptions.map((subscription) => stripe.subscriptions.cancel(subscription.id)));
                    }

                    return null;
                },
                'stripe:complete-checkout': async (sessionId) => {
                    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
                    const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', { customer: session.customer });

                    await stripe.subscriptions.create({
                        customer: session.customer,
                        default_payment_method: paymentMethod.id,
                        items: [{ price: session.line_items.data[0].price.id }],
                        metadata: { releaseName: session.metadata.releaseName },
                    });

                    return null;
                },
            });
        },
    },
});
