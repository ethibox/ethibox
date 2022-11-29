import 'dotenv/config';
import stripeEndpoint from '@api/stripe';
import Stripe from 'stripe';
import { mockApi } from '@lib/utils';
import { resetStripe, getCustomerNameFromPaymentMethods } from '@lib/stripe';
import { resetDatabase, initDatabase } from '@lib/orm';

describe('Given the stripe API', () => {
    let user;

    beforeEach(async () => {
        await resetDatabase();
        user = await initDatabase();
    });

    describe('When a call to /api/stripe is made with a GET method', () => {
        it('Should return the stripe portal url', async () => {
            const req = { method: 'GET', query: { baseUrl: 'http://localhost:3000' } };

            const res = await stripeEndpoint(req, mockApi(user), user);

            expect(res.status).toBe(200);
            expect(res.url).toContain('billing.stripe.com');
        });
    });

    describe('When a call to /api/stripe is made with a POST method', () => {
        it('Should return a Stripe checkout session url', async () => {
            const req = { method: 'POST', body: { baseUrl: 'http://localhost:3000', name: 'Wordpress' } };

            const res = await stripeEndpoint(req, mockApi(user), user);

            expect(res.url).toBeDefined();
            expect(res.status).toBe(200);
        });
    });

    describe('When resetStripe is called', () => {
        it('Should delete all Stripe cards', async () => {
            await resetStripe();

            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const customers = await stripe.customers.list({ limit: 100 });
            const paymentMethods = (await Promise.all(customers.data.map(async (customer) => {
                const { data } = await stripe.paymentMethods.list({ customer: customer.id });
                return data;
            }))).flat();

            expect(paymentMethods.length).toBe(0);
        });
    });

    describe('When getCustomerNameFromPaymentMethods is called', () => {
        it('Should return the customer name', async () => {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: '4242424242424242',
                    exp_month: 8,
                    exp_year: 2050,
                    cvc: '314',
                },
                billing_details: {
                    name: 'John Doe',
                },
            });
            await stripe.paymentMethods.attach(paymentMethod.id, { customer: user.id });

            const name = await getCustomerNameFromPaymentMethods(user.id);
            expect(name).toBe('John Doe');
        });
    });
});
