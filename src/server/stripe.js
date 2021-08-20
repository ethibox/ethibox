export const upsertProduct = async (stripe, appName, description = '', images = []) => {
    const { data: products } = await stripe.products.list();

    let product = products.find((p) => p.name === appName);

    if (!product) {
        product = await stripe.products.create({
            name: appName,
            images,
            ...(description && { description }),
            metadata: { application: 'ethibox' },
        });
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
        customer = await stripe.customers.create({
            id: userId,
            email,
            metadata: { application: 'ethibox' },
            preferred_locales: ['fr'],
        });
    }

    if (name) {
        await stripe.customers.update(`${userId}`, { name });
    }

    return customer;
};

export const invoiceList = async (stripe, userId) => {
    const { data: invoices } = await stripe.invoices.list({ customer: userId });

    return invoices;
};
