import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { Input, Button, Layout, Modal, Notification, Select } from '../components';
import { User } from '../lib/orm';
import nextI18nextConfig from '../next-i18next.config.mjs';

// eslint-disable-next-line complexity
export default ({ email, firstName = '', lastName = '', paymentMethod = null, stripeEnabled = false }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [state, setState] = useState({ firstName: firstName || '', lastName: lastName || '', language: router.locale });
    const [notification, setNotification] = useState({ show: false, title: '', description: '' });

    const redirectToStripePortal = async () => {
        setIsRedirecting(true);

        const returnUrl = `${window.location.origin}/${router.locale}/settings`;

        fetch('/api/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ returnUrl, locale: router.locale }),
        })
            .then(async (res) => {
                const { url, message } = await res.json();

                if (url && new URL(url).hostname === 'billing.stripe.com') {
                    window.location.href = url;
                } else {
                    throw new Error(message || 'An error occurred while redirecting to Stripe.');
                }
            })
            .catch(({ message }) => {
                setNotification({ show: true, title: 'Error', icon: Notification.XCircleIcon, description: message });
                setIsRedirecting(false);
            });
    };

    const onDelete = async () => {
        setIsDeleting(true);
        fetch('/api/settings', { method: 'DELETE' }).then(async (res) => {
            if (res.ok) {
                router.push('/logout');
            }
        }).catch(() => {
            setIsDeleting(false);
        });
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setState((s) => ({ ...s, [name]: value }));
    };

    const onSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({
                firstName: state.firstName,
                lastName: state.lastName,
            }),
        })
            .then(async (res) => {
                if (res.ok) {
                    if (state.language !== router.locale) {
                        await router.push(router.pathname, router.pathname, { locale: state.language });
                        document.cookie = `NEXT_LOCALE=${state.language}; path=/; max-age=31536000; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
                    }

                    setNotification({
                        show: true,
                        title: t('settings.account.success.title'),
                        description: t('settings.account.success.description'),
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification((s) => ({ ...s, show: false }));
            }, 3000);

            return () => clearTimeout(timer);
        }

        return undefined;
    }, [notification.show]);

    return (
        <Layout stripeEnabled={stripeEnabled}>
            <Notification
                show={notification.show}
                title={notification.title}
                description={notification.description}
                icon={notification.icon || Notification.CheckCircleIcon}
                onClose={() => setNotification((s) => ({ ...s, show: false }))}
            />

            <h1 className="text-2xl font-semibold text-gray-900">{t('settings.title')}</h1>
            <h2 className="mt-1 text-sm text-gray-500">{t('settings.description')}</h2>

            <form onSubmit={onSave}>
                <div className="container my-10 bg-white text-gray-700 overflow-hidden shadow rounded-lg divide-y divide-gray-200 my-4">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 my-4 text-xl !my-0">{t('settings.account.title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('settings.account.description')}</p>
                        </div>

                        <Input
                            id="email"
                            name="email"
                            type="email"
                            disabled
                            label={t('settings.account.email')}
                            className="mb-4"
                            defaultValue={email}
                        />

                        <Input
                            id="firstname"
                            name="firstName"
                            type="text"
                            placeholder="John"
                            label={t('settings.account.firstName')}
                            className="mb-4"
                            value={state.firstName}
                            onChange={onChange}
                        />

                        <Input
                            id="lastname"
                            name="lastName"
                            type="text"
                            placeholder="Doe"
                            label={t('settings.account.lastName')}
                            className="mb-4"
                            value={state.lastName}
                            onChange={onChange}
                        />

                        <Select
                            id="language"
                            name="language"
                            label={t('settings.language.label')}
                            value={state.language}
                            onChange={onChange}
                        >
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                        </Select>
                    </div>

                    <div className="px-4 py-4 sm:px-6">
                        <div className="justify-end grid grid-flow-col auto-cols-max gap-2 my-2">
                            <Button onClick={() => setIsModalOpen(true)} secondary>{t('settings.account.deleteAccount')}</Button>
                            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                                <Modal.Header icon={Modal.ExclamationTriangleIcon}>
                                    <Modal.Title>{t('settings.account.modal.title')}</Modal.Title>
                                    <Modal.Description>{t('settings.account.modal.description')}</Modal.Description>
                                </Modal.Header>
                                <Modal.Footer>
                                    <Button onClick={onDelete} loading={isDeleting} loadingText={t('apps.loadingStates.deleting')} className="!bg-red-500 hover:!bg-red-600 disabled:hover:!bg-red-500">{t('settings.account.modal.confirm')}</Button>
                                    <Button onClick={() => setIsModalOpen(false)} className="bg-white" secondary>{t('settings.account.modal.cancel')}</Button>
                                </Modal.Footer>
                            </Modal>
                            <Button type="submit" loading={loading} loadingText={t('apps.loadingStates.saving')}>{t('settings.account.save')}</Button>
                        </div>
                    </div>
                </div>
            </form>

            {stripeEnabled && (
                <div className="container my-10 bg-white text-gray-700 overflow-hidden shadow rounded-lg divide-y divide-gray-200 my-4">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 my-4 text-xl !my-0">{t('settings.payment.title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('settings.payment.description')}</p>
                        </div>
                        {paymentMethod ? (
                            <div className="flex items-center justify-between">
                                <p className="text-sm">
                                    {paymentMethod.type === 'card'
                                        ? `${t('settings.payment.currentMethod.text1')} ${paymentMethod.brand} ${t('settings.payment.currentMethod.text2')} ${paymentMethod.last4}.`
                                        : `${t('settings.payment.currentMethod.text1')} ${paymentMethod.label || paymentMethod.brand}.`}
                                </p>
                                <Button onClick={redirectToStripePortal} loading={isRedirecting} loadingText={t('apps.loadingStates.default')}>{t('settings.payment.manage')}</Button>
                            </div>
                        ) : (
                            <div className="sm:flex items-center justify-between">
                                <p className="my-2 text-sm text-gray-500">{t('settings.payment.noMethod')}</p>
                                <Button onClick={redirectToStripePortal} loading={isRedirecting} loadingText={t('apps.loadingStates.default')}>{t('settings.payment.addMethod')}</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = async ({ req, locale }) => {
    const email = req.headers['x-user-email'];
    const user = await User.findOne({ where: { email }, raw: true }).catch(() => false);

    if (!user) return { redirect: { destination: '/logout', permanent: false } };

    const { getStripePaymentMethod } = await import('../lib/stripe');

    return {
        props: {
            email: user.email,
            lastName: user.lastName,
            firstName: user.firstName,
            stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
            paymentMethod: process.env.STRIPE_SECRET_KEY ? await getStripePaymentMethod(user) : null,
            ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
        },
    };
};
