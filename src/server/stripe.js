export const upsertProduct = async (stripe, appName) => {
    const { data: products } = await stripe.products.list();

    let product = products.find((p) => p.name === appName);

    if (!product) {
        product = await stripe.products.create({ name: appName, metadata: { application: 'ethibox' } });
    }

    return product;
};

export const upsertPrice = async (stripe, productId, productPrice) => {
    const { data: prices } = await stripe.prices.list({ product: productId });

    let price = prices.find((p) => p.unit_amount === productPrice * 100);

    if (!price) {
        price = await stripe.prices.create({
            unit_amount: productPrice * 100,
            currency: 'eur',
            recurring: { interval: 'month' },
            product: productId,
            metadata: { application: 'ethibox' },
        });
    }

    return price;
};

export const upsertCustomer = async (stripe, userId, email, name) => {
    const { data: customers } = await stripe.customers.list({ email });

    let customer = customers.find((c) => c.id === `${userId}`);

    if (!customer) {
        customer = await stripe.customers.create({ id: userId, email, metadata: { application: 'ethibox' } });
    }

    if (name) {
        await stripe.customers.update(`${userId}`, { name });
    }

    return customer;
};

export const upsertSubscriptionItem = async (stripe, subscriptionId, priceId, appId) => {
    const { data: subscriptionItems } = await stripe.subscriptionItems.list({ subscription: subscriptionId });

    const existingSubscriptionItem = subscriptionItems.find((item) => item.price.id === priceId);

    if (!existingSubscriptionItem) {
        await stripe.subscriptionItems.create({ subscription: subscriptionId, price: priceId, proration_behavior: 'none', metadata: { application: 'ethibox', app_id: appId } });
    } else {
        const { id: subscriptionItemId, quantity } = existingSubscriptionItem;
        await stripe.subscriptionItems.update(subscriptionItemId, { quantity: quantity + 1, proration_behavior: 'none' });
    }
};

export const upsertPaymentMethod = async (stripe, userId, card) => {
    const { data: paymentMethods } = await stripe.paymentMethods.list({ customer: userId, type: 'card' });

    if (!paymentMethods.length) {
        const { id: paymentMethodId } = await stripe.paymentMethods.create({ type: 'card', card, metadata: { application: 'ethibox' } });
        await stripe.paymentMethods.attach(paymentMethodId, { customer: userId });
        await stripe.customers.update(`${userId}`, { invoice_settings: { default_payment_method: paymentMethodId } });
    }
};

export const upgradeSubscription = async (stripe, userId, appName, price, appId) => {
    const { data: subscriptions } = await stripe.subscriptions.list({ customer: userId, limit: 1 });

    let subscription = subscriptions[0];

    const product = await upsertProduct(stripe, appName);
    const { id: priceId } = await upsertPrice(stripe, product.id, price);

    if (!subscription) {
        subscription = await stripe.subscriptions.create({
            customer: userId,
            items: [{ price: priceId, metadata: { application: 'ethibox', app_id: appId } }],
            metadata: { application: 'ethibox' },
            proration_behavior: 'none',
        });
    } else {
        await upsertSubscriptionItem(stripe, subscription.id, priceId, appId);
    }

    return subscription;
};

export const downgradeSubscription = async (stripe, userId, appId) => {
    const { data: subscriptions } = await stripe.subscriptions.list({ customer: userId, limit: 1 });
    const subscription = subscriptions[0];

    const { data: subscriptionItems } = await stripe.subscriptionItems.list({ subscription: subscription.id });

    const subscriptionItem = subscriptionItems.find((si) => si.metadata.app_id === appId.toString());
    const { id: subscriptionItemId, quantity } = subscriptionItem;

    if (quantity === 1) {
        if (subscriptionItems.length > 1) {
            await stripe.subscriptionItems.del(subscriptionItem.id, { proration_behavior: 'none' });
        } else {
            await stripe.subscriptions.del(subscription.id, { prorate: false });
        }
    } else {
        await stripe.subscriptionItems.update(subscriptionItemId, { quantity: quantity - 1, proration_behavior: 'none' });
    }
};

export const invoiceList = async (stripe, userId) => {
    const { data: invoices } = await stripe.invoices.list({ customer: userId });

    return invoices;
};
