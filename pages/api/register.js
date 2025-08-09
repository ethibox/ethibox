import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../lib/orm';
import { WEBHOOK_EVENTS } from '../../lib/constants';
import { isValidEmail, isValidPassword, triggerWebhook, useTranslation } from '../../lib/utils';

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { email, password } = req.body;

    try {
        await isValidEmail(email);
        await isValidPassword(password);
    } catch ({ message }) {
        return res.status(401).send({ message: t(message) });
    }

    const user = await User.findOne({ where: { email }, paranoid: false }).catch(() => false);

    if (user) return res.status(401).send({ message: t('user_with_email_exists') });

    const hashPassword = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashPassword });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL || '30d' });

    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    await triggerWebhook(WEBHOOK_EVENTS.USER_REGISTERED, { email });

    return res.status(200).json({ ok: true });
};
