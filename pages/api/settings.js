import { App, User, Op } from '../../lib/orm';
import { triggerWebhook, useTranslation } from '../../lib/utils';
import { STATE, WEBHOOK_EVENTS } from '../../lib/constants';
import { upsertStripeCustomer, cancelStripeSubscription } from '../../lib/stripe';

const putQuery = async (req, res, user) => {
    const firstName = req.body.firstName || null;
    const lastName = req.body.lastName || null;

    await user.update({ firstName, lastName });

    if (process.env.STRIPE_SECRET_KEY) {
        await upsertStripeCustomer({ id: user.id, firstName, lastName });
    }

    return res.status(200).json({ ok: true });
};

const deleteQuery = async (req, res, user) => {
    const apps = await App.findAll({ where: { userId: user.id, state: { [Op.ne]: STATE.DELETED } } });

    for await (const app of apps) {
        await app.update({ state: STATE.DELETED });

        if (process.env.STRIPE_SECRET_KEY) {
            await cancelStripeSubscription(user, { releaseName: app.releaseName });
        }

        await triggerWebhook(WEBHOOK_EVENTS.APP_UNINSTALLED, {
            name: app.name,
            domain: app.domain,
            email: user.email,
            releaseName: app.releaseName,
        });
    }

    await user.destroy();

    res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=-1');
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

    if (req.method === 'PUT') return putQuery(req, res, user);
    if (req.method === 'DELETE') return deleteQuery(req, res, user);

    res.setHeader('Allow', ['PUT', 'DELETE']);

    return res.status(405).json({ message: t('method_not_allowed') });
};
