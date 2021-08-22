import 'babel-polyfill';
import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { reset, addSettings } from './fixture';
import { upsertProduct, upsertPrice, upsertCustomer } from '../stripe';

const prisma = new PrismaClient();

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

test('Should create a customer', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { id: 1, email: 'admin@example.com' };

    const customer = await upsertCustomer(stripe, data.id, data.email);

    expect(customer).toEqual(
        expect.objectContaining({ email: data.email }),
    );
});

test('Should update a customer', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const data = { id: 1, email: 'admin@example.com', name: 'Marty Mcfly' };

    const customer = await upsertCustomer(stripe, data.id, data.email, data.name);

    expect(customer).toEqual(
        expect.objectContaining({ name: data.name }),
    );
});
