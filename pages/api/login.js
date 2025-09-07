import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../lib/orm';
import { useTranslation } from '../../lib/utils';

// eslint-disable-next-line complexity
export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } }).catch(() => false);

    const passwordMatch = await bcrypt.compare(password, user?.password || '');

    if (!user || !passwordMatch) return res.status(401).send({ message: t('invalid_credentials') });

    const { firstName, lastName } = user;

    const token = jwt.sign({ firstName, lastName, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL || '30d' });

    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    return res.status(200).json({ ok: true });
};
