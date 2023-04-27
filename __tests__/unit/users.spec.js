import { mockApi } from '@lib/utils';
import usersEndpoint from '@api/users';
import { resetDatabase, initDatabase, User } from '@lib/orm';

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
        it('Should delete the user', async () => {
            const req = { method: 'DELETE' };

            const res = await usersEndpoint(req, mockApi(user), user);
            const deletedUser = await User.findOne({ where: { id: user.id }, raw: false });
            const apps = await deletedUser.getApps({ raw: false });

            expect(deletedUser.email).toEqual(`deleted+${user.email}`);
            expect(apps.every((app) => app.state === 'deleted')).toBeTruthy();
            expect(res.message).toBe('User deleted');
            expect(res.status).toBe(200);
        });
    });
});
