import jwt from 'jsonwebtoken';
import { User } from '../../lib/orm';
import { triggerWebhook } from '../../lib/utils';
import { WEBHOOK_EVENTS } from '../../lib/constants';

export default async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } }).catch(() => false);

    if (!user) return res.status(200).json({ ok: true });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const protocol = req.headers?.['x-forwarded-proto'] || 'http';
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${req.headers?.host || 'localhost:3000'}`}/reset-password?token=${token}`;

    console.log(`Password reset link for ${email}: ${resetUrl}`); // eslint-disable-line no-console

    await triggerWebhook(WEBHOOK_EVENTS.PASSWORD_RESET_REQUESTED, {
        resetUrl,
        email: user.email,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    return res.status(200).json({ ok: true });
};
