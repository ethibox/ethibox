import { jest } from '@jest/globals';
import handler from '../../pages/api/invoices';
import { User } from '../../lib/orm';
import stripe, { upsertStripeSubscription, upsertStripeCustomer } from '../../lib/stripe';

const setupCustomer = async (id, email) => {
    await upsertStripeCustomer({ id, email });
    const pm = await stripe.paymentMethods.create({ type: 'card', card: { number: '4242424242424242', exp_month: 12, exp_year: 2030, cvc: '123' } });
    await stripe.paymentMethods.attach(pm.id, { customer: `${id}` });
    await stripe.customers.update(`${id}`, { invoice_settings: { default_payment_method: pm.id } });
};

test('should retrieve stripe invoices', async () => {
    const email = `test+${Date.now()}@example.com`;
    const [user] = await User.findOrCreate({ where: { email }, defaults: { password: 'password123' } });

    await setupCustomer(user.id, email);
    await upsertStripeSubscription({ id: user.id, email }, 'Wordpress');

    const req = {
        method: 'GET',
        headers: { 'x-user-email': email },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const invoicesData = res.json.mock.calls[0][0];
    expect(Array.isArray(invoicesData)).toBe(true);
    expect(invoicesData.length).toBeGreaterThan(0);
    expect(invoicesData[0]).toHaveProperty('id');
    expect(invoicesData[0]).toHaveProperty('total');
    expect(invoicesData[0]).toHaveProperty('status');
}, 20000);
