import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Notification, Button, Layout } from '../components';
import { fetchTemplates } from '../lib/utils';
import nextI18nextConfig from '../next-i18next.config.mjs';

export default ({ templates, appName = null, stripeEnabled = false }) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [isLoading, setLoading] = useState(appName);
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });

    const handleInstall = async (name) => {
        if (isLoading && isLoading !== name) return;

        setLoading(name);

        const returnUrl = `${window.location.origin}${router.basePath}/${router.locale}`;

        fetch(`${router.basePath}/api/apps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ name, returnUrl }),
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
            });
    };

    useEffect(() => {
        if (!appName) return;
        router.replace('/', undefined, { shallow: true });
        handleInstall(appName);
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
                                    <Link href={website} target="_blank" className="text-xs underline" rel="noreferrer">{t('index.moreInfos')}</Link>
                                </div>
                            </div>

                            <div className="p-4">
                                <Button className="w-full" onClick={() => handleInstall(name)} loading={isLoading === name} loadingText={t('index.loading')} secondary>{t('index.install')}</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export const getServerSideProps = async ({ query, locale }) => {
    const props = {
        templates: await fetchTemplates(),
        stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
        ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
    };

    const sessionId = query.session_id || null;

    if (!process.env.STRIPE_SECRET_KEY || !sessionId) return { props };

    const { getStripeCheckoutSession } = await import('../lib/stripe');

    const session = await getStripeCheckoutSession(sessionId);

    if (!session) return { props };

    return { props: { ...props, appName: session?.metadata?.appName } };
};
