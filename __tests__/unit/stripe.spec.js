import stripe, {
    upsertStripePrice,
    upsertStripeProduct,
    upsertStripeCustomer,
    getStripePaymentMethod,
    createStripeCheckoutUrl,
    cancelStripeSubscription,
    upsertStripeSubscription,
} from '../../lib/stripe';
import { User, App, sequelize } from '../../lib/orm';

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

test('Should create a stripe customer', async () => {
    const user = { id: 1, firstName: 'John', lastName: 'Doe', email: 'contact@ethibox.fr' };

    await upsertStripeCustomer(user);

    const customer = await stripe.customers.retrieve(`${user.id}`);
    expect(customer.id).toBe(`${user.id}`);
    expect(customer.email).toBe(user.email);
    expect(customer.name).toBe('John Doe');
}, 20000);

test('Should retrieve payment method of a stripe customer', async () => {
    const user = { id: 1, email: 'contact@ethibox.fr' };
    await upsertStripeCustomer({ id: user.id, email: user.email });
    const pm = await stripe.paymentMethods.create({ type: 'card', card: { number: '4242424242424242', exp_month: 12, exp_year: 2030, cvc: '123' } });
    await stripe.paymentMethods.attach(pm.id, { customer: `${user.id}` });
    await stripe.customers.update(`${user.id}`, { invoice_settings: { default_payment_method: pm.id } });

    const paymentMethod = await getStripePaymentMethod({ id: user.id, email: 'contact@ethibox.fr' });

    expect(paymentMethod.last4).toBe('4242');
}, 20000);

test('Should create a stripe product', async () => {
    const product = await upsertStripeProduct('Nextcloud');

    expect(product.id).toMatch(/^prod_/);
}, 20000);

test('Should create a stripe price', async () => {
    const product = await upsertStripeProduct('Nextcloud');
    const price = await upsertStripePrice(product);

    expect(price.id).toMatch(/^price_/);
}, 20000);

test('Shoud create a stripe subscription', async () => {
    const user = { id: 1, email: 'contact@ethibox.fr' };
    const subscription = await upsertStripeSubscription({ id: user.id }, 'Nextcloud');

    expect(subscription.id).toMatch(/^sub_/);
}, 20000);

test('Should not create a stripe subscription if the customer does not have a payment method', async () => {
    const user = { id: 2, email: 'contact+2@ethibox.fr' };
    await upsertStripeCustomer({ id: user.id, email: user.email });

    const subscription = await upsertStripeSubscription({ id: user.id }, 'Nextcloud');

    expect(subscription).toBe(null);
}, 20000);

test('Should cancel a stripe subscription', async () => {
    const user = { id: 1, email: 'contact@ethibox.fr' };
    const subscription = await upsertStripeSubscription({ id: user.id }, 'Nextcloud', { releaseName: 'nextcloud1' });

    await cancelStripeSubscription({ id: user.id }, { releaseName: 'nextcloud1' });

    const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
    expect(updatedSubscription.status).toBe('canceled');
}, 20000);

test('Should create multiple stripe subscriptions with the same product name', async () => {
    const user = { id: 1, email: 'contact@ethibox.fr' };
    await upsertStripeSubscription({ id: user.id }, 'Nextcloud');
    await upsertStripeSubscription({ id: user.id }, 'Nextcloud');
}, 20000);

test('Should create a checkout url', async () => {
    const email = 'contact@ethibox.fr';
    const [user] = await User.findOrCreate({ where: { email }, defaults: { password: 'myp@ssw0rd' } });
    const app = await App.create({ releaseName: 'nextcloud1', domain: 'nextcloud1.localhost', userId: user.id });
    const url = await createStripeCheckoutUrl(app, user);

    expect(url).toContain('https://checkout.stripe.com');
}, 20000);
