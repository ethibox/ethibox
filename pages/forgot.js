import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import isEmail from 'validator/lib/isEmail';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Input, Notification } from '../components';
import nextI18nextConfig from '../next-i18next.config.mjs';

export default () => {
    const router = useRouter();
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const email = String(formData.get('email') || '');

        if (!isEmail(email)) {
            setNotification({
                show: true,
                title: t('forgot.error.title'),
                description: t('forgot.error.invalidEmail'),
                icon: Notification.XCircleIcon,
            });
            setLoading(false);
            return;
        }

        fetch(`${router.basePath}/api/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ email }),
        })
            .then((res) => res.json())
            .then(({ ok, message }) => {
                if (ok) {
                    setNotification({
                        show: true,
                        title: t('forgot.success.title'),
                        description: t('forgot.success.message'),
                        icon: Notification.CheckCircleIcon,
                    });
                } else {
                    setNotification({
                        show: true,
                        title: t('forgot.error.title'),
                        description: message || t('forgot.error.defaultMessage'),
                        icon: Notification.XCircleIcon,
                    });
                }
            }).finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
            <Notification
                show={notification.show}
                title={notification.title}
                description={notification.description}
                icon={notification.icon}
                onClose={() => setNotification((s) => ({ ...s, show: false }))}
            />

            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <img alt="logo" src="/logo.svg" className="mx-auto h-16 w-auto" />
                <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                    {t('forgot.title')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('forgot.description')}
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder={t('forgot.email.placeholder')}
                        label={t('forgot.email.label')}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-md bg-gray-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-60"
                    >
                        {isLoading ? t('forgot.submitting') : t('forgot.submit')}
                    </button>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-500">
                    {t('forgot.remembered')}
                    {' '}
                    <Link href="/login" className="font-semibold text-gray-600 hover:text-gray-500">
                        {t('forgot.signIn')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export const getStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
    },
});
