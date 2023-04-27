import Stripe from 'stripe';

const upsertProduct = async (stripe, name, description = '', images = []) => {
    const products = await stripe.products.list({ limit: 100 });
    const product = products.data.find((p) => p.name === name);

    if (product) return product;

    return stripe.products.create({
        name,
        ...(images.length && { images }),
        ...(description && { description }),
    });
};

const upsertPrice = async (stripe, product, unitAmount = 0, currency = 'eur') => {
    const prices = await stripe.prices.list({ limit: 100 });
    const price = prices.data.find((p) => p.product === product.id && p.unit_amount === unitAmount * 100 && p.active);

    if (price) return price;

    return stripe.prices.create({
        unit_amount: unitAmount * 100,
        recurring: { interval: 'month' },
        product: product.id,
        currency,
    });
};

export const getCustomerSubscriptions = async (customerId) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const subscriptions = await stripe.subscriptions.list({ customer: customerId });

    return subscriptions?.data || [];
};

export const deleteSubscription = async (subscriptionId) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.del(subscriptionId, { prorate: false });
};

export const getCustomerNameFromPaymentMethods = async (customerId) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentMethods = await stripe.customers.listPaymentMethods(`${customerId}`);

    return paymentMethods.data.find((pm) => pm.billing_details.name)?.billing_details.name;
};

export const upsertCustomer = async (stripe, email, id, name = '', locale = 'en') => {
    const customers = await stripe.customers.list({ limit: 100 });
    const customer = customers.data.find((c) => c.id === id);

    if (customer) return customer;

    return stripe.customers.create({ id, email, preferred_locales: [locale] })
        .catch(() => stripe.customers.update(`${id}`, { email, name }));
};

export const resetStripe = async () => {
    if (process.env.CYPRESS !== 'true' && process.env.NODE_ENV !== 'test') return;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const customers = await stripe.customers.list({ limit: 100 });

    await Promise.all(customers.data.map(async (customer) => {
        const paymentMethods = await stripe.paymentMethods.list({ customer: customer.id });
        await Promise.all(paymentMethods.data.map(async (paymentMethod) => {
            await stripe.paymentMethods.detach(paymentMethod.id);
        }));
    }));
};

export const createStripePortalUrl = async (user, baseUrl = 'http://localhost:3000', locale = 'en') => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    await upsertCustomer(stripe, user.email, user.id, `${user.firstName} ${user.lastName}`, locale);

    const { url } = await stripe.billingPortal.sessions.create({
        locale,
        customer: user.id,
        return_url: `${baseUrl}/settings`,
    });

    return url;
};

export const createStripeCheckoutSession = async (app, user, baseUrl = 'http://localhost:3000', locale = 'en') => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const product = await upsertProduct(stripe, app.name, app.description, app.images);
    const price = await upsertPrice(stripe, product, app.price);
    const customer = await upsertCustomer(stripe, user.email, user.id, `${user.firstName} ${user.lastName}`, locale);

    const { id, url, metadata } = await stripe.checkout.sessions.create({
        locale,
        success_url: `${baseUrl}/apps?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/`,
        line_items: [{ price: price.id, quantity: 1 }],
        allow_promotion_codes: true,
        customer: customer.id,
        mode: 'subscription',
        subscription_data: { trial_period_days: app.trial },
        metadata: { ...app },
    });

    return { id, url, metadata };
};
