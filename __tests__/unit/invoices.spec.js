import 'dotenv/config';
import invoicesEndpoint from '@api/invoices';
import { resetDatabase, initDatabase } from '@lib/orm';
import { mockApi } from '@lib/utils';

describe('Given the invoices API', () => {
    let user;

    beforeAll(async () => {
        await resetDatabase();
        user = await initDatabase();
    });

    describe('When a call to /api/invoices is made with valid credentials', () => {
        it('Should return invoices and a 200 status code', async () => {
            const req = { body: { email: 'contact+test@ethibox.fr', password: 'myp@ssw0rd' } };

            const res = await invoicesEndpoint(req, mockApi(user), user);

            expect(res.invoices).toBeDefined();
            expect(res.status).toBe(200);
        });
    });
});
