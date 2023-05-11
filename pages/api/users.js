import 'dotenv/config';
import bcrypt from 'bcrypt';
import { protectRoute, sendWebhook, isValidPassword } from '@lib/utils';
import { upsertCustomer, getCustomerSubscriptions, deleteSubscription } from '@lib/stripe';

const getQuery = (_, res, user) => res.status(200).send({ user });

const putQuery = async (body, res, user) => {
    const { firstName = '', lastName = '', password } = body || {};

    if (!firstName && !lastName && !password) {
        return res.status(400).send({ message: 'Missing required parameters' });
    }

    if (password) {
        await isValidPassword(password).catch((err) => res.status(401).send({ message: err.message }));
        const hashPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashPassword });
    }

    await user.update({ firstName, lastName });
    await upsertCustomer(user.email, user.id, `${firstName} ${lastName}`);

    return res.status(200).send({ message: 'User updated' });
};

const deleteQuery = async (_, res, user) => {
    await user.update({ email: `deleted+${user.email}` }, { where: { id: user.id } });
    const apps = await user.getApps({ raw: false });

    const subscriptions = await getCustomerSubscriptions(user.id);

    for await (const subscription of subscriptions) {
        await deleteSubscription(subscription.id);
    }

    for await (const app of apps) {
        await app.update({ state: 'deleted' });

        await sendWebhook({
            releaseName: app.releaseName,
            name: app.name,
            email: user.email,
            type: 'uninstall-app',
        });
    }

    return res.status(200).send({ message: 'User deleted' });
};

export default protectRoute(async ({ body, method }, res, user) => {
    if (method === 'GET') return getQuery(body, res, user);
    if (method === 'PUT') return putQuery(body, res, user);
    if (method === 'DELETE') return deleteQuery(body, res, user);

    return res.status(405).send({ message: 'Method not allowed' });
});
