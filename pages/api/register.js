import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@lib/orm';
import { isValidEmail, isValidPassword, sendWebhook } from '@lib/utils';

export default async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send({ message: 'Missing parameters' });

    const user = await User.findOne({ where: { email } });

    try {
        await isValidEmail(email);
        await isValidPassword(password);
    } catch (err) {
        return res.status(401).send({ message: err.message });
    }

    if (user) return res.status(401).send({ message: 'A user with that email already exists' });

    const hashPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashPassword });
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL || '30d' });

    await sendWebhook({ email, token, type: 'register-user' });

    return res.status(200).send({ token });
};
