import { jest } from '@jest/globals';
import { STATE, TEST_PASSWORD } from '../../lib/constants';

jest.unstable_mockModule('../../lib/docker', () => ({
    init: jest.fn().mockResolvedValue(true),
    deploy: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true),
}));

const { default: stripe, getStripeSubscriptions, deleteStripePaymentMethod } = await import('../../lib/stripe');
const { default: handler } = await import('../../pages/api/apps');
const { User, App, sequelize } = await import('../../lib/orm');
const { uninstall } = await import('../../lib/cron');

const email = 'contact+trial@ethibox.fr';

const installApp = async (name) => {
    const req = { method: 'POST', headers: { 'x-user-email': email }, body: { name } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };

    await handler(req, res);

    return res;
};

const cancelSubscriptions = async (user) => {
    const subscriptions = await getStripeSubscriptions(user);

    await Promise.all(subscriptions.map((s) => stripe.subscriptions.cancel(s.id)));
};

beforeAll(async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });
    await sequelize.sync({ force: true });

    const user = await User.create({ email, password: TEST_PASSWORD });

    await cancelSubscriptions(user);
    await deleteStripePaymentMethod(user);
}, 30000);

afterAll(async () => cancelSubscriptions(await User.findOne({ where: { email } })), 30000);

test('Should start a free trial without payment method when installing an app', async () => {
    const res = await installApp('Kanboard');

    expect(res.status).toHaveBeenCalledWith(201);
}, 30000);

test('Should not start a second free trial while one is in progress', async () => {
    const res = await installApp('Wordpress');

    expect(res.status).toHaveBeenCalledWith(403);
}, 30000);

test('Should start several free trials at once with a payment method', async () => {
    const user = await User.findOne({ where: { email } });
    const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: `${user.id}` });
    await stripe.customers.update(`${user.id}`, { invoice_settings: { default_payment_method: pm.id } });

    const res = await installApp('Wordpress');

    expect(res.status).toHaveBeenCalledWith(201);
}, 30000);

test('Should uninstall apps whose subscription has been canceled', async () => {
    const user = await User.findOne({ where: { email } });
    const [subscription] = await getStripeSubscriptions(user);
    await stripe.subscriptions.cancel(subscription.id);

    await uninstall();

    const app = await App.findOne({ where: { releaseName: subscription.metadata.releaseName } });
    expect(app.state).toBe(STATE.DELETED);
}, 30000);
