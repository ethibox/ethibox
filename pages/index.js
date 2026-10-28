import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Notification, Button, Layout, Trial } from '../components';
import { User } from '../lib/orm';
import { fetchTemplates } from '../lib/utils';
import { getStripePaymentMethod } from '../lib/stripe';
import nextI18nextConfig from '../next-i18next.config.mjs';

export default ({ templates, appName = null, stripeEnabled = false, paymentMethod = null }) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [isLoading, setLoading] = useState(false);
    const [trial, setTrial] = useState({ open: false, name: null });
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });

    const closeTrial = () => setTrial((s) => ({ ...s, open: false }));

    const handleInstall = async (name) => {
        if (isLoading && isLoading !== name) return;

        setLoading(name);

        fetch('/api/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ name }),
        })
            .then(async (res) => {
                const { url, message } = await res.json();

                if (!res.ok) {
                    throw new Error(message);
                }

                router.push(url);
            })
            .catch(({ message }) => {
                setNotification({
                    show: true,
                    title: t('index.notifications.failed.title'),
                    description: message || t('index.notifications.failed.description'),
                    icon: Notification.XCircleIcon,
                });
                setLoading(false);
                closeTrial();
            });
    };

    const requestInstall = (name) => (stripeEnabled ? setTrial({ open: true, name }) : handleInstall(name));

    useEffect(() => {
        if (!appName) return;
        router.replace('/', undefined, { shallow: true });
        requestInstall(appName);
    }, [appName]);

    return (
        <Layout stripeEnabled={stripeEnabled}>
            <Notification
                show={notification.show}
                icon={notification.icon}
                title={notification.title}
                button={notification.button}
                description={notification.description}
                onClose={() => setNotification((s) => ({ ...s, show: false }))}
            />

            <Trial
                app={templates.find(({ name }) => name === trial.name)}
                paymentMethod={paymentMethod}
                open={trial.open}
                loading={isLoading === trial.name}
                onClose={closeTrial}
                onConfirm={() => handleInstall(trial.name)}
            />

            <h1 className="text-2xl font-semibold text-gray-900">{t('index.title')}</h1>
            <h2 className="mt-1 text-sm text-gray-500">{t('index.description')}</h2>

            <div className="container my-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {templates.map(({ name, category, website, logo }) => (
                        <div key={name} data-test="app" className="overflow-hidden rounded-lg bg-white shadow-sm">
                            <div className="px-4 py-5">
                                <span className="text-sm text-gray-700 float-right">
                                    <img src={logo} className="w-14 h-14" alt={name} />
                                </span>
                                <p className="text-sm font-semibold block">{name}</p>
                                <p className="text-sm text-gray-500">{category}</p>

                                <div className="flex mt-4">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 mr-1" />
                                    <Link href={website} target="_blank" className="text-xs underline" rel="noreferrer">{t('index.learnMore')}</Link>
                                </div>
                            </div>

                            <div className="p-4">
                                <Button className="w-full" onClick={() => requestInstall(name)} loading={isLoading === name} loadingText={t('index.loading')} secondary>{t('index.install')}</Button>
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="flex-1 px-4 py-5 flex items-center justify-center">
                            <p className="text-center font-semibold text-gray-900">{t('index.askingTitle')}</p>
                        </div>
                        <div className="p-4">
                            <Link href="https://ethibox.fr/support?newapp=true" passHref>
                                <Button className="w-full" secondary>{t('index.askingButton')}</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export const getServerSideProps = async ({ req, query, locale }) => {
    const email = req.headers['x-user-email'];
    const user = await User.findOne({ where: { email }, raw: true }).catch(() => false);

    if (!user) return { redirect: { destination: '/logout', permanent: false } };

    const templates = await fetchTemplates();
    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

    return {
        props: {
            templates,
            appName: templates.find(({ name }) => name.toLowerCase() === query.app)?.name || null,
            stripeEnabled,
            paymentMethod: stripeEnabled ? await getStripePaymentMethod(user) : null,
            ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
        },
    };
};
