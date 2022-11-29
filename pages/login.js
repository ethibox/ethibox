import { useState, useEffect } from 'react';
import { Link, Input, Button, Heading, Checkbox, useNotification } from '@johackim/design-system';
import { useAuth } from '@lib/contexts';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import isEmail from 'validator/lib/isEmail';
import DefaultLayout from '@components/defaultLayout';

export default () => {
    const [state, setState] = useState({ email: '', password: '', rememberMe: false });
    const [isLoading, setLoading] = useState(false);
    const notification = useNotification();
    const router = useRouter();
    const auth = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (auth.isLoggedIn) {
            router.push(`/${router.locale}`);
            notification.add({ title: t('Login'), text: t('You are already logged in'), type: 'info', timeout: 5 });
        }
    }, []);

    const handleChange = (e) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = state;

        if (!isEmail(email)) {
            notification.add({ title: t('Error'), type: 'error', text: t('Invalid email') });
            return;
        }

        if (!password) {
            notification.add({ title: t('Error'), type: 'error', text: t('Password is required') });
            return;
        }

        setLoading(true);

        fetch(`${router.basePath}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
        })
            .then((res) => res.json())
            .then(({ token, message }) => {
                if (token) {
                    auth.login(token);
                    router.push('/');
                    notification.add({ title: t('Login'), text: t('You are now logged in'), timeout: 5 });
                } else {
                    notification.add({ title: t('Login'), text: t(message), type: 'error', timeout: 5 });
                    setLoading(false);
                }
            });
    };

    const { email, password, rememberMe } = state;

    return (
        <DefaultLayout className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <img src={`${router.basePath}/logo.svg`} className="w-14 mx-auto" alt="logo" />

                <Heading size="h2" className="text-center text-[1.8rem]">{t('Sign in to your account')}</Heading>

                <p>
                    <span>{`${t('Or')} `}</span>
                    <Link href="/register">{t('Sign up')}</Link>
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        placeholder={t('Email address')}
                        onChange={handleChange}
                        value={email}
                        name="email"
                        data-test="login-email"
                        className="w-full my-1"
                    />

                    <Input
                        type="password"
                        placeholder={t('Password')}
                        onChange={handleChange}
                        value={password}
                        name="password"
                        data-test="login-password"
                        className="w-full my-1"
                    />

                    <div className="flex justify-between mt-2">
                        <Checkbox label={t('Remember me')} value={rememberMe} />
                        <Link href="/forgot">{t('Forgot your password?')}</Link>
                    </div>

                    <Button type="submit" className="w-full mt-4" data-test="login-button" onClick={handleSubmit} loading={isLoading}>
                        {t('Sign in')}
                    </Button>
                </form>
            </div>
        </DefaultLayout>
    );
};
