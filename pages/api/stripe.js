import { protectRoute, isObjectEmpty } from '@lib/utils';
import { createStripePortalUrl, createStripeCheckoutSession } from '@lib/stripe';

const getQuery = async (body, res, user) => {
    const { baseUrl, locale } = body;

    if (!baseUrl) return res.status(400).send({ message: 'Missing required parameters' });

    const apps = await user.getApps();

    if (!apps.length) return res.status(404).send({ success: false, message: 'You need to install an app first' });

    const url = await createStripePortalUrl(user, baseUrl, locale);
    return res.status(200).send({ url });
};

const postQuery = async (body, res, user) => {
    const { name, baseUrl, locale } = body;

    if (!name) return res.status(400).send({ message: 'Missing required parameters' });

    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());
    const template = templates.find((t) => t.title.toLowerCase() === name.toLowerCase());

    if (!template) return res.status(404).send({ message: 'App not found' });

    const app = { name: template.title, price: template.price, trial: template.trial };

    const { url } = await createStripeCheckoutSession(app, user, baseUrl, locale);

    return res.status(200).send({ url });
};

export default protectRoute(async ({ body, query, method }, res, user) => {
    if (method === 'GET') return getQuery(isObjectEmpty(body) ? query : body, res, user);
    if (method === 'POST') return postQuery(isObjectEmpty(body) ? query : body, res, user);

    return res.status(405).send({ message: 'Method not allowed' });
});
