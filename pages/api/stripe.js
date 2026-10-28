import { User } from '../../lib/orm';
import { useTranslation } from '../../lib/utils';
import { createStripeSetupIntent, deleteStripePaymentMethod } from '../../lib/stripe';

const postQuery = async (req, res, user) => {
    const { client_secret: clientSecret } = await createStripeSetupIntent(user);

    return res.status(200).json({ clientSecret });
};

const deleteQuery = async (req, res, user) => {
    await deleteStripePaymentMethod(user);

    return res.status(200).json({ ok: true });
};

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const email = req.headers['x-user-email'];

    const user = await User.findOne({ where: { email } }).catch(() => false);

    if (!user) {
        res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
        return res.status(401).json({ message: t('unauthorized') });
    }

    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ message: t('stripe_not_enabled') });

    if (req.method === 'POST') {
        return postQuery(req, res, user);
    }

    if (req.method === 'DELETE') {
        return deleteQuery(req, res, user);
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).end(t('method_not_allowed'));
};
