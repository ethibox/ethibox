import Stripe from 'stripe';
import { DEFAULT_PRICE, DEFAULT_CURRENCY, DEFAULT_INTERVAL, DEFAULT_LOCALE } from './constants';

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
            brand: m.card?.brand,
            last4: m.card?.last4,
            label: m.card?.brand && m.card?.last4 ? `${m.card.brand.toUpperCase()} •••• ${m.card.last4}` : undefined,
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

export const getStripeSubscriptions = async (user) => {
    const subscriptions = await stripe.subscriptions.list({ customer: user.id }).catch(() => false);

    return subscriptions?.data || [];
};

export const upsertStripeSubscription = async (user, name, metadata = {}) => {
    const product = await upsertStripeProduct(name);
    const price = await upsertStripePrice(product);
    const customer = await upsertStripeCustomer(user);
    const paymentMethod = await getStripePaymentMethod(user);

    if (!paymentMethod) return null;

    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id, quantity: 1 }],
        default_payment_method: paymentMethod.id,
        trial_period_days: process.env.FREE_TRIAL_DAYS,
        metadata,
    });

    return subscription;
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
    const invoices = await stripe.invoices.list({ customer: customer.id });

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

export const createStripePortalUrl = async (user, returnUrl, locale) => {
    const customer = await upsertStripeCustomer(user);

    const configurations = await stripe.billingPortal.configurations.list({ active: true });

    if (configurations.data.length === 0) {
        await stripe.billingPortal.configurations.create({
            features: {
                payment_method_update: {
                    enabled: true,
                },
            },
        });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        locale: locale || 'en',
        customer: customer.id,
        return_url: returnUrl,
    });

    return portalSession?.url;
};

export const getStripeCheckoutSession = async (sessionId) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);

    return session;
};

export const createStripeCheckoutUrl = async (app, user, returnUrl = 'http://localhost:3000', locale = DEFAULT_LOCALE) => {
    const product = await upsertStripeProduct(app.name);
    const price = await upsertStripePrice(product);
    const customer = await upsertStripeCustomer({ ...user, locale });

    const { url } = await stripe.checkout.sessions.create({
        locale,
        mode: 'subscription',
        customer: customer.id,
        cancel_url: returnUrl,
        allow_promotion_codes: true,
        metadata: { appName: app.name },
        line_items: [{ price: price.id, quantity: 1 }],
        subscription_data: {
            metadata: { releaseName: app.releaseName },
            trial_period_days: process.env.FREE_TRIAL_DAYS,
        },
        success_url: `${returnUrl}/?session_id={CHECKOUT_SESSION_ID}`,
    });

    return url;
};

export default stripe;
