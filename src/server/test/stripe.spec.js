import 'babel-polyfill';
import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { reset, addSettings } from './fixture';
import { invoiceList, upsertProduct, upsertPrice, upsertCustomer } from '../stripe';

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

    const data = { id: USER_ID, email: 'admin@example.com' };

    const customer = await upsertCustomer(stripe, data.id, data.email);

    expect(customer).toEqual(
        expect.objectContaining({ email: data.email }),
    );
});

test.skip('Should return invoice list', async () => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const invoices = await invoiceList(stripe, USER_ID);

    expect(invoices.length).toEqual(1);
});
