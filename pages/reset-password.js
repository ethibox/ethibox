import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Notification, Input } from '../components';
import nextI18nextConfig from '../next-i18next.config.mjs';

export default ({ token }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [isLoading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });

    const handleResetSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');

        if (password !== confirmPassword) {
            setNotification({
                show: true,
                title: t('resetPassword.error.title'),
                description: t('resetPassword.error.passwordMismatch'),
                icon: Notification.XCircleIcon,
            });
            setLoading(false);
            return;
        }

        fetch(`${router.basePath}/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ token, password }),
        })
            .then((res) => res.json())
            .then(({ ok, message }) => {
                if (ok) {
                    setNotification({
                        show: true,
                        title: t('resetPassword.success.title'),
                        description: t('resetPassword.success.message'),
                        icon: Notification.CheckCircleIcon,
                    });
                    setTimeout(() => {
                        router.push('/login');
                    }, 3000);
                } else {
                    setNotification({
                        show: true,
                        title: t('resetPassword.error.title'),
                        description: message || t('resetPassword.error.defaultMessage'),
                        icon: Notification.XCircleIcon,
                    });
                    setLoading(false);
                }
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
                    {t('resetPassword.title')}
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleResetSubmit} className="space-y-6">
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder={t('resetPassword.newPassword.placeholder')}
                        label={t('resetPassword.newPassword.label')}
                    />
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder={t('resetPassword.confirmPassword.placeholder')}
                        label={t('resetPassword.confirmPassword.label')}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !token}
                        className="flex w-full justify-center rounded-md bg-gray-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-60"
                    >
                        {isLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
                    </button>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-500">
                    <Link href="/login" className="font-semibold text-gray-600 hover:text-gray-500">
                        {t('resetPassword.backToSignIn')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export async function getServerSideProps(context) {
    const { token } = context.query;
    const { locale } = context;

    if (!token) {
        return { redirect: { destination: '/', permanent: false } };
    }

    return {
        props: {
            token,
            ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
        },
    };
}
