import { useState } from 'react';
import { Link, Input, Button, Heading, useNotification } from '@johackim/design-system';
import { useAuth } from '@lib/contexts';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import DefaultLayout from '@components/defaultLayout';

export default () => {
    const [state, setState] = useState({ email: '', password: '' });
    const [isLoading, setLoading] = useState(false);
    const notification = useNotification();
    const router = useRouter();
    const auth = useAuth();
    const { t } = useTranslation();

    const handleChange = (e) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = state;

        if (!email) {
            notification.add({ title: t('Error'), text: t('Email is required'), type: 'error', timeout: 5 });
            return;
        }

        if (!password) {
            notification.add({ title: t('Error'), text: t('Password is required'), type: 'error', timeout: 5 });
            return;
        }

        setLoading(true);

        fetch(`${router.basePath}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
        })
            .then((res) => res.json())
            .then(({ token, message }) => {
                if (token) {
                    auth.login(token);
                    router.push('/');
                    notification.add({ title: t('Registration'), text: t('You are now registered'), timeout: 5 });
                } else {
                    notification.add({ title: t('Error'), text: t(message), type: 'error', timeout: 5 });
                    setLoading(false);
                }
            });
    };

    const { email, password } = state;

    return (
        <DefaultLayout className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <img src={`${router.basePath}/logo.svg`} className="w-14 mx-auto" alt="logo" />

                <Heading size="h2" className="text-center">{t('Sign up to your account')}</Heading>

                <p>
                    <span>{`${t('Or')} `}</span>
                    <Link href="/login">{t('Sign in')}</Link>
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        placeholder={t('Email address')}
                        onChange={handleChange}
                        value={email}
                        name="email"
                        data-test="register-email"
                        className="w-full my-1"
                    />

                    <Input
                        type="password"
                        placeholder={t('Password')}
                        onChange={handleChange}
                        value={password}
                        name="password"
                        data-test="register-password"
                        className="w-full my-1"
                    />

                    <Button type="submit" className="w-full mt-4" data-test="register-button" onClick={handleSubmit} loading={isLoading}>
                        {t('Register')}
                    </Button>
                </form>

                <p className="mt-2 text-sm leading-5 text-gray-600 text-center">
                    <span>{t('By creating an account, you agree to the')}</span>
                    {' '}
                    <Link href="https://ethibox.fr/cgu" className="underline">{t('Terms of Service')}</Link>
                </p>
            </div>
        </DefaultLayout>
    );
};
