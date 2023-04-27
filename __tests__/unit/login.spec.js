import 'dotenv/config';
import bcrypt from 'bcrypt';
import { mockApi } from '@lib/utils';
import loginEndpoint from '@api/login';
import { resetDatabase, User } from '@lib/orm';

describe('Given the login API', () => {
    beforeAll(async () => {
        await resetDatabase();
        const hashPassword = await bcrypt.hash('myp@ssw0rd', 10);
        await User.create({ email: 'contact+test@ethibox.fr', password: hashPassword });
    });

    describe('When a call to /api/login is made with valid credentials', () => {
        it('Should return a token and a 200 status code', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'myp@ssw0rd' } };

            const res = await loginEndpoint(req, mockApi());

            expect(res.token).toBeDefined();
            expect(res.status).toBe(200);
        });
    });

    describe('When a call to /api/login is made with invalid credentials', () => {
        it('Should return a 401 status code', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'badpassword' } };

            const res = await loginEndpoint(req, mockApi());

            expect(res.message).toBe('Invalid credentials');
            expect(res.status).toBe(401);
        });
    });
});
