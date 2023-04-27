import { useEffect } from 'react';
import { SidebarLayout, useNotification } from '@johackim/design-system';
import { HomeIcon, ViewGridIcon, DocumentTextIcon, CogIcon, LogoutIcon } from '@heroicons/react/outline';
import { useAuth } from '@lib/contexts';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

export default ({ children, className }) => {
    const router = useRouter();
    const { notifications } = useNotification();
    const { isLoggedIn } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (notifications.find((n) => n.text === t('You are not authenticated'))) {
            router.push('/login');
        }
    }, [notifications]);

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, []);

    const removeTrailingSlash = (path) => path.replace(/\/$/, '');
    const isActive = (href) => removeTrailingSlash(router.asPath) === removeTrailingSlash(href);

    const sidebarLinks = [
        { name: t('Home'), href: '/', active: isActive('/'), icon: <HomeIcon className="mr-4 h-6 w-6" fill="none" /> },
        { name: t('Applications'), href: '/apps', active: isActive('/apps'), icon: <ViewGridIcon className="mr-4 w-6 h-6" fill="none" /> },
        { name: t('Invoices'), href: '/invoices', active: isActive('/invoices'), icon: <DocumentTextIcon className="mr-4 w-6 h-6" fill="none" /> },
        { name: t('Settings'), href: '/settings', active: isActive('/settings'), icon: <CogIcon className="mr-4 w-6 h-6" fill="none" /> },
        { name: t('Sign out'), href: '/logout', active: isActive('/logout'), icon: <LogoutIcon className="mr-4 w-6 h-6" fill="none" />, footer: true, 'data-test': 'logout' },
    ];

    return (
        <SidebarLayout
            className={className}
            links={sidebarLinks}
            logo={`${router.basePath}/logo.png`}
        >
            {children}
        </SidebarLayout>
    );
};
