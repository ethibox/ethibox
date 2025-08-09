import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../lib/orm';
import { isValidPassword, useTranslation } from '../../lib/utils';

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { token, password } = req.body;

    if (!token) return res.status(401).send({ message: t('missing_token') });

    try {
        await isValidPassword(password);
    } catch (err) {
        return res.status(401).send({ message: t(err.message) });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).send({ message: t('user_not_found') });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        await User.update({ password: hashPassword }, { where: { email } });

        return res.status(200).json({ ok: true });
    } catch (_) {
        return res.status(401).send({ message: t('invalid_or_expired_token') });
    }
};
