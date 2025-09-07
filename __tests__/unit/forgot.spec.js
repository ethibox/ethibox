import { jest } from '@jest/globals';
import { User } from '../../lib/orm';
import handler from '../../pages/api/forgot';

global.fetch = jest.fn(() => Promise.resolve({
    status: 200,
    ok: true,
}));

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

test('should send webhook when user exists', async () => {
    process.env.WEBHOOK_URL = 'https://webhook.example.com';
    const email = 'test@example.com';

    await User.findOrCreate({ where: { email }, defaults: { password: 'hashedpassword' } });

    const req = { body: { email } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
        'https://webhook.example.com',
        expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'X-Ethibox-Event': 'password.reset_requested',
            }),
        }),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Password reset link for test@example.com'),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
});
