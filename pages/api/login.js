import jwt from 'jsonwebtoken';
import { User } from '@lib/orm';
import bcrypt from 'bcrypt';

export default async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Missing parameters' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(401).send({ message: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(401).send({ message: 'Invalid credentials' });

    const { firstName, lastName } = user;
    const token = jwt.sign({ firstName, lastName, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL || '30d' });

    return res.status(200).send({ token });
};
