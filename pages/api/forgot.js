import jwt from 'jsonwebtoken';
import { User } from '@lib/orm';
import { sendWebhook } from '@lib/utils';

export default async (req, res) => {
    const { email, baseUrl } = req.body;

    if (!email) {
        return res.status(400).send({ message: 'Missing parameters' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).send({ message: 'User not found' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const url = `${baseUrl}/forgot?token=${token}`;

    await sendWebhook({ email, url, token, type: 'forgot-user' });

    return res.status(200).send({ message: 'Email sent' });
};
