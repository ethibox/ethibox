import Stripe from 'stripe';
import { DEFAULT_PRICE, DEFAULT_CURRENCY, DEFAULT_INTERVAL, DEFAULT_TRIAL_DAYS } from './constants.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : false;

export const upsertStripeCustomer = async ({ id, email, firstName, lastName, locale }) => {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    const payload = {
        name,
        ...(email && { email }),
        ...(locale && { preferred_locales: [locale] }),
    };

    const customer = await stripe.customers.retrieve(`${id}`).catch(() => null);

    if (customer) {
        return stripe.customers.update(`${id}`, payload);
    }

    return stripe.customers.create({ id: `${id}`, ...payload });
};

export const upsertStripeProduct = async (name) => {
    const products = await stripe.products.list({ active: true, limit: 100 });
    const product = products.data.find((p) => p.name === name);

    if (product) return product;

    return stripe.products.create({ name });
};

export const upsertStripePrice = async (product) => {
    const prices = await stripe.prices.list({ product: product.id });

    const price = prices.data.find((p) => p.unit_amount === DEFAULT_PRICE
        && p.currency === DEFAULT_CURRENCY
        && p.recurring.interval === DEFAULT_INTERVAL);

    if (price) return price;

    return stripe.prices.create({
        product: product.id,
        unit_amount: DEFAULT_PRICE,
        currency: DEFAULT_CURRENCY,
        recurring: { interval: DEFAULT_INTERVAL },
    });
};

export const getStripePaymentMethod = async (user) => {
    const customer = await upsertStripeCustomer(user);

    const defaultPaymentId = customer.invoice_settings?.default_payment_method;

    const pm = await stripe.paymentMethods.retrieve(defaultPaymentId).catch(() => null);

    if (!pm) return null;

    const builders = {
        card: (m) => ({
            id: m.id,
            type: m.type,
            brand: m.card.brand,
            last4: m.card.last4,
            expires: `${String(m.card.exp_month).padStart(2, '0')}/${m.card.exp_year}`,
            label: `${m.card.brand.toUpperCase()} •••• ${m.card.last4}`,
        }),
        sepa_debit: (m) => ({
            id: m.id,
            type: m.type,
            brand: 'SEPA',
            last4: m.sepa_debit?.last4,
            label: m.sepa_debit?.last4 ? `SEPA •••• ${m.sepa_debit.last4}` : 'SEPA',
        }),
        paypal: (m) => ({ id: m.id, type: m.type, brand: 'PayPal', label: 'PayPal' }),
    };

    const builder = builders[pm.type] || ((m) => ({ id: m.id, type: m.type, label: m.type }));

    return builder(pm);
};

export const getStripeSubscriptions = (user) => stripe.subscriptions.list({ customer: user.id }).autoPagingToArray({ limit: 10000 }).catch((error) => {
    if (error.code === 'resource_missing') return [];

    throw error;
});

export const hasStripeTrialInProgress = async (user) => (await getStripeSubscriptions(user)).some((s) => s.status === 'trialing');

export const upsertStripeSubscription = async (user, name, metadata = {}) => {
    const product = await upsertStripeProduct(name);
    const price = await upsertStripePrice(product);
    const customer = await upsertStripeCustomer(user);

    return stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id, quantity: 1 }],
        trial_period_days: DEFAULT_TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata,
    });
};

export const getCanceledStripeSubscriptions = async (since) => {
    const events = await stripe.events.list({ type: 'customer.subscription.deleted', created: { gte: since } }).autoPagingToArray({ limit: 10000 });

    return events.map((event) => event.data.object);
};

export const cancelStripeSubscription = async (user, metadata) => {
    const subscriptions = await getStripeSubscriptions(user);

    const subscription = subscriptions.find((s) => s.metadata.releaseName === metadata.releaseName);

    if (subscription) {
        await stripe.subscriptions.cancel(subscription.id, { prorate: false });
    }
};

export const getStripeInvoices = async (user) => {
    const customer = await upsertStripeCustomer(user);
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 100 });

    return invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        date: invoice.created * 1000,
        description: invoice.lines.data[0]?.description,
        total: invoice.total / 100,
        currency: invoice.currency,
        status: invoice.status,
        url: invoice.hosted_invoice_url,
    }));
};

export const createStripeSetupIntent = async (user) => {
    const customer = await upsertStripeCustomer(user);

    return stripe.setupIntents.create({ customer: customer.id });
};

const setStripeDefaultPaymentMethod = async (user, paymentMethodId) => {
    const subscriptions = await getStripeSubscriptions(user);

    await stripe.customers.update(`${user.id}`, { invoice_settings: { default_payment_method: paymentMethodId } });
    await Promise.all(subscriptions.map((s) => stripe.subscriptions.update(s.id, { default_payment_method: paymentMethodId })));
};

export const updateStripePaymentMethod = async (user, setupIntentId) => {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId).catch(() => null);

    if (setupIntent?.customer !== `${user.id}` || setupIntent.status !== 'succeeded') return;

    await setStripeDefaultPaymentMethod(user, setupIntent.payment_method);
};

export const deleteStripePaymentMethod = async (user) => {
    const paymentMethod = await getStripePaymentMethod(user);

    if (!paymentMethod) return;

    await setStripeDefaultPaymentMethod(user, '');
    await stripe.paymentMethods.detach(paymentMethod.id);
};

export default stripe;
