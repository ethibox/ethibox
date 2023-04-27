import 'dotenv/config';
import bcrypt from 'bcrypt';
import forgotEndpoint from '@api/forgot';
import { resetDatabase, User } from '@lib/orm';
import { mockApi } from '@lib/utils';

describe('Given the forgot API', () => {
    beforeAll(async () => {
        await resetDatabase();
        const hashPassword = await bcrypt.hash('myp@ssw0rd', 10);
        await User.create({ email: 'contact+test@ethibox.fr', password: hashPassword });
    });

    describe('When a call to /api/forgot is made with valid email', () => {
        it('Should send a reset password email', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr' } };

            const res = await forgotEndpoint(req, mockApi());

            expect(res.status).toBe(200);
            expect(res.message).toBe('Email sent');
        });
    });
});
