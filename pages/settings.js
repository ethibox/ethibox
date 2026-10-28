import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Input, Button, Layout, Loading, Modal, Notification, Select } from '../components';
import { User } from '../lib/orm';
import { DEFAULT_CURRENCY } from '../lib/constants';
import nextI18nextConfig from '../next-i18next.config.mjs';

// eslint-disable-next-line complexity
const Settings = ({ email, firstName = '', lastName = '', paymentMethod = null, stripeEnabled = false }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [state, setState] = useState({ firstName: firstName || '', lastName: lastName || '', language: router.locale });
    const [notification, setNotification] = useState({ show: false, title: '', description: '' });

    const savePaymentMethod = async () => {
        const { error: submitError } = await elements.submit();

        if (submitError) throw submitError;

        const { clientSecret } = await fetch('/api/stripe', { method: 'POST', headers: { 'Accept-Language': router.locale } }).then((res) => res.json());

        const { error } = await stripe.confirmSetup({ elements, clientSecret, confirmParams: { return_url: window.location.href } });

        if (error) throw error;
    };

    const onDeletePaymentMethod = async () => {
        setIsDeletingPayment(true);
        await fetch('/api/stripe', { method: 'DELETE', headers: { 'Accept-Language': router.locale } })
            .then(() => router.replace(router.asPath))
            .finally(() => setIsDeletingPayment(false));
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

        await fetch('/api/settings', {
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

                    if (isEditingPayment) await savePaymentMethod();

                    setNotification({
                        show: true,
                        title: t('settings.account.success.title'),
                        description: t('settings.account.success.description'),
                    });
                }
            })
            .catch(({ message }) => {
                setNotification({ show: true, title: 'Error', icon: Notification.XCircleIcon, description: message });
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                disabled
                                label={t('settings.account.email')}
                                className="sm:col-span-2"
                                defaultValue={email}
                            />

                            <Input
                                id="firstname"
                                name="firstName"
                                type="text"
                                placeholder="John"
                                label={t('settings.account.firstName')}
                                value={state.firstName}
                                onChange={onChange}
                            />

                            <Input
                                id="lastname"
                                name="lastName"
                                type="text"
                                placeholder="Doe"
                                label={t('settings.account.lastName')}
                                value={state.lastName}
                                onChange={onChange}
                            />

                            <Select
                                id="language"
                                name="language"
                                label={t('settings.language.label')}
                                className="sm:col-span-2"
                                value={state.language}
                                onChange={onChange}
                            >
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                            </Select>
                        </div>

                        {stripe && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-base font-semibold text-gray-900">{t('settings.payment.title')}</h4>
                                <p className="mt-1 text-sm text-gray-500">{t('settings.payment.description')}</p>
                                <div className="mt-4">
                                    {isEditingPayment && <PaymentElement />}

                                    {!isEditingPayment && paymentMethod && (
                                        <div className="flex flex-col gap-4 rounded-md px-4 py-4 outline-1 -outline-offset-1 outline-gray-300 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <CreditCardIcon className="size-8 shrink-0 text-gray-400" />
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">{paymentMethod.label}</span>
                                                    {paymentMethod.expires && <span className="block text-gray-500 sm:inline sm:ml-2">{t('settings.payment.expires', { date: paymentMethod.expires })}</span>}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 gap-4 text-sm font-medium">
                                                <button type="button" onClick={onDeletePaymentMethod} disabled={isDeletingPayment} className="cursor-pointer text-gray-700 hover:text-gray-900 disabled:cursor-not-allowed">{isDeletingPayment ? <Loading text={t('apps.loadingStates.deleting')} size="sm" /> : t('settings.payment.delete')}</button>
                                                <button type="button" onClick={() => setIsEditingPayment(true)} className="cursor-pointer text-gray-700 hover:text-gray-900">{t('settings.payment.edit')}</button>
                                            </div>
                                        </div>
                                    )}

                                    {!isEditingPayment && !paymentMethod && (
                                        <button type="button" onClick={() => setIsEditingPayment(true)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-3 py-4 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900">
                                            <PlusIcon className="size-5" />
                                            {t('settings.payment.addMethod')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-4 sm:px-6">
                        <div className="flex flex-col-reverse gap-2 my-2 sm:flex-row sm:justify-between">
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
        </Layout>
    );
};

export default ({ stripePublishableKey, ...props }) => {
    const [stripePromise] = useState(() => (stripePublishableKey ? loadStripe(stripePublishableKey) : null));

    return (
        <Elements stripe={stripePromise} options={{ mode: 'setup', currency: DEFAULT_CURRENCY }}>
            <Settings {...props} />
        </Elements>
    );
};

export const getServerSideProps = async ({ req, query, locale }) => {
    const email = req.headers['x-user-email'];
    const user = await User.findOne({ where: { email }, raw: true }).catch(() => false);

    if (!user) return { redirect: { destination: '/logout', permanent: false } };

    const { getStripePaymentMethod, updateStripePaymentMethod } = await import('../lib/stripe');

    if (query.setup_intent) {
        await updateStripePaymentMethod(user, query.setup_intent);
        return { redirect: { destination: `/${locale}/settings`, permanent: false } };
    }

    return {
        props: {
            email: user.email,
            lastName: user.lastName,
            firstName: user.firstName,
            stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
            paymentMethod: process.env.STRIPE_SECRET_KEY ? await getStripePaymentMethod(user) : null,
            ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
        },
    };
};
