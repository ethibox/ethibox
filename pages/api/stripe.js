import { User } from '../../lib/orm';
import { useTranslation } from '../../lib/utils';
import { createStripePortalUrl } from '../../lib/stripe';

const postQuery = async (req, res, user) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ message: t('stripe_not_enabled') });

    const { returnUrl, locale } = req.body;

    const url = await createStripePortalUrl(user, returnUrl, locale);

    return res.status(200).json({ url });
};

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const email = req.headers['x-user-email'];

    const user = await User.findOne({ where: { email }, raw: false }).catch(() => false);

    if (!user) {
        res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
        return res.status(401).json({ message: t('unauthorized') });
    }

    if (req.method === 'POST') {
        return postQuery(req, res, user);
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(t('method_not_allowed'));
};
