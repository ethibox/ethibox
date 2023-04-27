import { useState } from 'react';
import { useRouter } from 'next/router';
import { Link, Input, Button, Heading, useNotification } from '@johackim/design-system';
import { useTranslation } from 'react-i18next';
import isEmail from 'validator/lib/isEmail';
import DefaultLayout from '@components/defaultLayout';

export default () => {
    const [state, setState] = useState({ email: '', password: '', confirmPassword: '' });
    const notification = useNotification();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { token } = router.query;
    const { t } = useTranslation();

    const handleChange = (e) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleForgot = async () => {
        const baseUrl = `${window.location.protocol}//${window.location.host}${router.basePath}/${router.locale}`;

        if (isEmail(state.email)) {
            setIsLoading(true);

            fetch(`${router.basePath}/api/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.email, baseUrl }),
            }).then(() => {
                notification.add({ title: t('Check your inbox'), text: t("If your email address is associated with an account. You'll receive an email shortly."), timeout: 10 });
            }).finally(() => {
                setIsLoading(false);
            });
        } else {
            notification.add({ title: t('Forgot password'), text: t('Please enter a valid email'), type: 'error', timeout: 5 });
        }
    };

    const handleReset = async () => {
        if (state.password !== state.confirmPassword) {
            notification.add({ title: t('Forgot password'), text: t('Passwords do not match'), type: 'error', timeout: 5 });
            return;
        }

        setIsLoading(true);

        fetch(`${router.basePath}/api/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password: state.password }),
        })
            .then(async (res) => {
                const { message } = await res.json();

                if (res.status !== 200) {
                    notification.add({ title: t('Erreur'), text: t(message), type: 'error', timeout: 5 });
                    return;
                }

                notification.add({ title: t('Forgot password'), text: t('Password updated'), timeout: 5 });
                router.push('/login');
            }).finally(() => {
                setIsLoading(false);
            });
    };

    const { email, password, confirmPassword } = state;

    return (
        <DefaultLayout className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <img src={`${router.basePath}/logo.svg`} className="w-14 mx-auto" alt="logo" />

                {token ? (
                    <>
                        <Heading size="h2" className="text-center">{t('Set up a new password')}</Heading>

                        <Input
                            type="password"
                            name="password"
                            data-test="password"
                            onChange={handleChange}
                            value={password}
                            placeholder={t('Password')}
                            className="w-full my-1"
                        />

                        <Input
                            type="password"
                            placeholder={t('Confirm password')}
                            data-test="confirm-password"
                            onChange={handleChange}
                            value={confirmPassword}
                            name="confirmPassword"
                            className="w-full my-1"
                        />

                        <Button className="w-full mt-2" data-test="reset-button" onClick={handleReset} loading={isLoading}>{t('Update password')}</Button>
                    </>
                ) : (
                    <>
                        <Heading size="h2" className="text-center">{t('Forgot your password?')}</Heading>

                        <p>
                            <span>{`${t('Or')} `}</span>
                            <Link href="/login">{t('Sign in')}</Link>
                        </p>

                        <Input
                            type="email"
                            placeholder={t('Email address')}
                            onChange={handleChange}
                            value={email}
                            name="email"
                            data-test="forgot-email"
                            className="w-full my-1"
                        />

                        <Button className="w-full mt-2" data-test="forgot-button" onClick={handleForgot} loading={isLoading}>{t('Send password reset link')}</Button>
                    </>
                )}
            </div>
        </DefaultLayout>
    );
};
