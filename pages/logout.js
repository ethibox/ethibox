import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@lib/contexts';
import { useNotification } from '@johackim/design-system';
import { useTranslation } from 'react-i18next';

export default () => {
    const auth = useAuth();
    const router = useRouter();
    const notification = useNotification();
    const { t } = useTranslation();

    useEffect(() => {
        auth.logout();
        router.push('/login');
        notification.add({ title: t('Logged out'), text: t('You have been logged out'), type: 'info', timeout: 5 });
    }, []);

    return <p>Redirect...</p>;
};
