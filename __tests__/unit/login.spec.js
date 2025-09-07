import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import handler from '../../pages/api/login';
import { User } from '../../lib/orm';

test('should login with valid credentials', async () => {
    const email = `test+${Date.now()}@example.com`;
    const password = 'myp@ssw0rd';
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOrCreate({
        where: { email },
        defaults: { password: hashedPassword },
    });

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

test('should reject invalid credentials', async () => {
    const email = 'nonexistent@example.com';
    const wrongPassword = 'wrongpassword';

    const req = { body: { email, password: wrongPassword } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid credentials' });
});
