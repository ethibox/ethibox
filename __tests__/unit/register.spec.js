import 'dotenv/config';
import registerEndpoint from '@api/register';
import { resetDatabase, User } from '@lib/orm';
import { mockApi } from '@lib/utils';

describe('Given the register API', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    describe('When a call to /api/register is made with valid credentials', () => {
        it('Should return a token and a 200 status code', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'myp@ssw0rd' } };

            const res = await registerEndpoint(req, mockApi());

            const user = await User.findOne({ where: { email: req.body.email } });
            expect(user.email).toBe(req.body.email);
            expect(res.token).toBeDefined();
            expect(res.status).toBe(200);
        });
    });

    describe('When a call to /api/register is made with invalid email', () => {
        it('Should return a 401 status code', async () => {
            const req = { body: { email: 'bademail@@example.com', password: 'myp@ssw0rd' } };

            const res = await registerEndpoint(req, mockApi());

            expect(res.message).toBe('Your email is invalid');
            expect(res.status).toBe(401);
        });
    });

    describe('When a call to /api/register is made with invalid password', () => {
        it('Should return a 401 status code', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'pass' } };

            const res = await registerEndpoint(req, mockApi());

            expect(res.message).toBe('Your password must be at least 6 characters');
            expect(res.status).toBe(401);
        });
    });

    describe('When a call to /api/register is made with existing email', () => {
        it('Should return a 401 status code', async () => {
            User.create({ email: 'contact+test@ethibox.fr', password: 'myp@ssw0rd' });
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'myp@ssw0rd' } };

            const res = await registerEndpoint(req, mockApi());

            expect(res.message).toBe('A user with that email already exists');
            expect(res.status).toBe(401);
        });
    });
});
