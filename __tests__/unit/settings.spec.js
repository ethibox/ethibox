import { jest } from '@jest/globals';
import { STATE } from '../../lib/constants';
import { User, App, sequelize } from '../../lib/orm';
import handler from '../../pages/api/settings';
import stripe, { upsertStripeCustomer, upsertStripeSubscription } from '../../lib/stripe';

await sequelize.sync({ force: true });

test('Should update user firstName and lastName', async () => {
    const email = 'contact@ethibox.fr';
    const { id } = await User.create({ email, password: 'password', firstName: 'John', lastName: 'Doe' });

    const req = {
        method: 'PUT',
        headers: { 'x-user-email': email },
        body: { firstName: 'Marty', lastName: 'Mcfly' },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    const updatedUser = await User.findOne({ where: { email } });
    expect(updatedUser.firstName).toBe('Marty');
    expect(updatedUser.lastName).toBe('Mcfly');

    const stripeCustomer = await stripe.customers.retrieve(`${id}`).catch(() => null);
    expect(stripeCustomer.name).toBe('Marty Mcfly');
});

test('Should delete user account', async () => {
    const email = 'contact@ethibox.fr';
    await User.findOrCreate({ where: { email }, defaults: { password: 'myp@ssw0rd' } });

    const req = { method: 'DELETE', headers: { 'x-user-email': email } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    const deletedUser = await User.findOne({ where: { email } });
    expect(deletedUser).toBeNull();
});

test('Should delete user apps when deleting account', async () => {
    const email = 'contact+2@ethibox.fr';
    const [user] = await User.findOrCreate({ where: { email }, defaults: { password: 'myp@ssw0rd' } });

    await App.create({ releaseName: 'nextcloud1', domain: 'nextcloud1.localhost', userId: user.id });
    await App.create({ releaseName: 'wordpress2', domain: 'wordpress1.localhost', userId: user.id });

    const req = { method: 'DELETE', headers: { 'x-user-email': email } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    const apps = await App.findAll({ where: { userId: user.id } });

    apps.forEach((app) => {
        expect(app.state).toBe(STATE.DELETED);
    });
});

test('Should delete user stripe subscriptions when deleting account', async () => {
    const email = 'contact+3@ethibox.fr';
    const [user] = await User.findOrCreate({ where: { email }, defaults: { password: 'myp@ssw0rd' } });

    await upsertStripeCustomer({ id: user.id, email });

    const pm = await stripe.paymentMethods.create({
        type: 'card',
        card: { number: '4242424242424242', exp_month: 12, exp_year: 2030, cvc: '123' },
    });

    await stripe.paymentMethods.attach(pm.id, { customer: `${user.id}` });
    await stripe.customers.update(`${user.id}`, { invoice_settings: { default_payment_method: pm.id } });

    await App.create({ releaseName: 'nextcloud3', domain: 'nextcloud3.localhost', userId: user.id });
    const subscription = await upsertStripeSubscription({ id: user.id, email }, 'Nextcloud', { releaseName: 'nextcloud3' });

    const req = { method: 'DELETE', headers: { 'x-user-email': email } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    const cancelledSubscription = await stripe.subscriptions.retrieve(subscription.id);
    expect(cancelledSubscription.status).toBe('canceled');
}, 20000);
