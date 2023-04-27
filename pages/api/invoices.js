import 'dotenv/config';
import Stripe from 'stripe';
import { protectRoute } from '@lib/utils';

export default protectRoute(async (req, res, user) => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { data } = await stripe.invoices.list({ customer: user.id, limit: 100 }).catch(() => ({ data: [] }));

    const invoices = data.map((invoice) => ({
        ...invoice,
        url: invoice.hosted_invoice_url,
        total: invoice.amount_paid / 100,
        date: new Date(invoice.created * 1000),
        description: invoice.lines.data[0].description,
        year: new Date(invoice.created * 1000).getFullYear(),
        status: `${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`,
        month: new Date(invoice.created * 1000).toLocaleString('default', { month: 'long' }),
    }));

    return res.status(200).send({ invoices });
});
