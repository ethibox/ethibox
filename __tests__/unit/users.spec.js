import { mockApi } from '@lib/utils';
import usersEndpoint from '@api/users';
import { getCustomerSubscriptions, createSubscription, upsertProduct, upsertPrice, upsertCustomer } from '@lib/stripe';
import { resetDatabase, initDatabase, User, App } from '@lib/orm';

describe('Given the users endpoint', () => {
    let user;

    beforeAll(async () => {
        await resetDatabase();
        user = await initDatabase();
    });

    describe('When a call to /api/users is made with a PUT method', () => {
        it('Should update the user', async () => {
            const req = { method: 'PUT', body: { firstName: 'John', lastName: 'Doe' } };

            const res = await usersEndpoint(req, mockApi(user), user);

            expect(res.message).toBe('User updated');
            expect(res.status).toBe(200);
        });
    });

    describe('When a call to /api/users is made with a DELETE method', () => {
        beforeEach(async () => {
            await resetDatabase();
            user = await initDatabase();
        });

        it('Should delete the user', async () => {
            const req = { method: 'DELETE' };

            const res = await usersEndpoint(req, mockApi(user), user);

            const deletedUser = await User.findOne({ where: { id: user.id }, raw: false });
            expect(deletedUser.email).toEqual(`deleted-${user.id}+${user.email}`);
            expect(res.message).toBe('User deleted');
            expect(res.status).toBe(200);
        });

        it('Should delete the apps', async () => {
            await App.create({ releaseName: 'ghost1', domain: 'ghost1.localhost', userId: user.id });
            const req = { method: 'DELETE' };

            await usersEndpoint(req, mockApi(user), user);

            const apps = await App.findAll({ where: { userId: user.id }, raw: false });
            expect(apps.every((app) => app.state === 'deleted')).toBeTruthy();
        });

        it('Should delete the user stripe subscriptions', async () => {
            await App.create({ releaseName: 'ghost1', domain: 'ghost1.localhost', userId: user.id });
            const product = await upsertProduct('Ghost');
            const price = await upsertPrice(product, 19);
            const customer = await upsertCustomer(user.email, user.id);
            await createSubscription(customer.id, price.id, 7, { releaseName: 'ghost1' });
            const req = { method: 'DELETE' };

            await usersEndpoint(req, mockApi(user), user);

            const subscriptions = await getCustomerSubscriptions(user.id);
            expect(subscriptions.length).toBe(0);
        });
    });
});
