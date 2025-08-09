import { User } from '../../lib/orm';
import { useTranslation } from '../../lib/utils';
import { getStripeInvoices } from '../../lib/stripe';

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const email = req.headers['x-user-email'];

    const user = await User.findOne({ where: { email }, raw: false }).catch(() => false);

    if (!user) {
        res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
        return res.status(401).json({ message: t('unauthorized') });
    }

    if (req.method === 'GET') {
        const invoices = process.env.STRIPE_SECRET_KEY ? await getStripeInvoices(user) : [];
        return res.status(200).json(invoices || []);
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(t('method_not_allowed'));
};
