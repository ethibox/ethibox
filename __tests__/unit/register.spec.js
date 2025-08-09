import { jest } from '@jest/globals';
import handler from '../../pages/api/register';
import { User } from '../../lib/orm';

test('should register with valid credentials', async () => {
    const email = `test+${Date.now()}@example.com`;
    const password = 'myp@ssw0rd';

    const req = { body: { email, password } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('token='),
    );
});

test('should reject user that already exists', async () => {
    const email = `existing+${Date.now()}@example.com`;
    const password = 'myp@ssw0rd';

    await User.create({ email, password: 'hashedpassword' });

    const req = { body: { email, password } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'A user with that email already exists' });
});

test('should reject invalid email', async () => {
    const email = 'invalid-email';
    const password = 'myp@ssw0rd';

    const req = { body: { email, password } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid email address' });
});
