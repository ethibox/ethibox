import 'babel-polyfill';
import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { reset, addUser, addSettings, addApps, importTemplates } from './fixture';
import { invoiceList, upsertProduct, upsertPrice, upsertCustomer, upgradeSubscription, upsertPaymentMethod, downgradeSubscription } from '../stripe';
import { upgradeStripeSubscriptionMutation } from '../resolvers';

const prisma = new PrismaClient();

const USER_ID = Date.now();

beforeAll(async () => {
    await reset(prisma);

    await addSettings([
        { name: 'stripeSecretKey', value: process.env.STRIPE_SECRET_KEY },
        { name: 'stripeEnabled', value: 'true' },
    ], prisma);
});

test('Should upsert a product', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const appName = 'Wordpress';
    const product = await upsertProduct(stripe, appName);

    expect(product).toEqual(
        expect.objectContaining({ name: appName }),
    );
});

test('Should upsert a price', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { appName: 'Wordpress', price: 19 };

    const { id: productId } = await upsertProduct(stripe, data.appName);
    const price = await upsertPrice(stripe, productId, data.price);

    expect(price).toEqual(
        expect.objectContaining({ unit_amount: data.price * 100 }),
    );
});

test('Should upsert a customer', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { id: USER_ID, email: 'admin@ethibox.fr' };

    const customer = await upsertCustomer(stripe, data.id, data.email);

    expect(customer).toEqual(
        expect.objectContaining({ email: data.email }),
    );
});

test('Should upgrade a subscription', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { userId: USER_ID, appName: 'Wordpress', appId: 1, price: 19 };

    await upsertPaymentMethod(stripe, data.userId, { number: '4242424242424242', exp_month: 7, exp_year: 2025, cvc: '314' });
    const subscription = await upgradeSubscription(stripe, data.userId, data.appName, data.price, data.appId);

    expect(subscription).toEqual(
        expect.objectContaining({ customer: `${data.userId}` }),
    );
});

test('Should downgrade a subscription', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { userId: USER_ID, appId: 1 };

    await downgradeSubscription(stripe, data.userId, data.appId);
});

test('Should upgrade a subscription - resolver', async () => {
    await importTemplates(prisma);
    const user = await addUser({ email: 'admin@ethibox.fr', password: 'myp@ssw0rd' }, prisma);
    await addApps([{ templateId: 1, userId: user.id }], prisma);

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const ctx = { user, prisma };
    const { id: userId } = await upsertCustomer(stripe, ctx.user.id, ctx.user.email);
    await upsertPaymentMethod(stripe, ctx.user.id, { number: '4242424242424242', exp_month: 7, exp_year: 2025, cvc: '314' });

    const data = { userId, appId: 1, price: 19 };
    expect(await upgradeStripeSubscriptionMutation(null, data, ctx)).toEqual(true);
});

test('Should return invoice list', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const invoices = await invoiceList(stripe, USER_ID);

    expect(invoices.length).toEqual(1);
});
