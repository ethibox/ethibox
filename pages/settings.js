import { useState } from 'react';
import { Panel, Input, Button, Loading, useNotification, useModal } from '@johackim/design-system';
import { useAuth, useApi } from '@lib/contexts';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@components/sidebarLayout';

export default () => {
    const router = useRouter();
    const notification = useNotification();
    const modal = useModal();
    const auth = useAuth();
    const { data, setData, isLoading } = useApi(`${router.basePath}/api/users`);
    const { t } = useTranslation();
    const [isSaving, setSaving] = useState(false);
    const [isRedirecting, setRedirecting] = useState(false);

    if (isLoading) {
        return (
            <SidebarLayout className="flex items-center justify-center">
                <Loading text={t('Loading...')} size="xl" />
            </SidebarLayout>
        );
    }

    const handleChange = (e) => {
        setData((d) => ({ ...d, [e.target.name]: e.target.value }));
    };

    const deleteAccount = async () => {
        await fetch(`${router.basePath}/api/users`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
        });

        localStorage.removeItem('user');
        router.push('/login');
        notification.add({ title: t('Delete account'), text: t('Your account has been deleted'), timeout: 5 });
        modal.remove('confirm-delete-account');
    };

    const openModal = () => {
        modal.add({
            id: 'confirm-delete-account',
            title: t('Confirm account deletion'),
            children: (
                <>
                    <p className="my-2">{t('By deleting your user account, you will also delete all applications and cancel any billing associated with them')}</p>
                    <p className="my-2 font-bold">{t('Are you sure you want to delete your account? There’s no coming back from this!')}</p>
                </>
            ),
            footer: (
                <>
                    <Button onClick={() => modal.remove('confirm-delete-account')} className="!bg-white" secondary>{t('Cancel')}</Button>
                    <Button onClick={deleteAccount} data-test="confirm-delete-account" className="!bg-red-700 hover:!bg-red-800">{t('Delete my account')}</Button>
                </>
            ),
        });
    };

    const redirectToStripe = () => {
        setRedirecting(true);
        const baseUrl = `${window.location.protocol}//${window.location.host}${router.basePath}/${router.locale}`;

        fetch(`${router.basePath}/api/stripe?baseUrl=${baseUrl}&locale=${router.locale}`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
        })
            .then((res) => res.json())
            .then(({ url, message }) => {
                if (url) {
                    window.location.replace(url);
                } else {
                    notification.add({ title: t('Error'), text: t(message), type: 'error', timeout: 5 });
                    setRedirecting(false);
                }
            });
    };

    const handleSubmit = async () => {
        setSaving(true);

        await fetch(`${router.basePath}/api/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
            body: JSON.stringify(data),
        })
            .then(async (res) => {
                const { message } = await res.json();

                if (res.status !== 200) {
                    throw new Error(message);
                }

                notification.add({ title: t('Successfully saved!'), text: t('Your data has been saved'), timeout: 5 });
            }).catch(({ message }) => {
                notification.add({ title: t('Error'), text: t(message), type: 'error', timeout: 5 });
            }).finally(() => {
                setSaving(false);
            });
    };

    const { email, firstName, lastName } = data;

    return (
        <SidebarLayout>
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900">{t('Settings')}</h1>
                    <h2 className="mt-1 text-sm text-gray-500">{t('Manage your account settings')}</h2>
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    <div className="py-4">
                        <Panel
                            title={t('Account informations')}
                            description={t('Manage your informations associated with your account')}
                            footer={(
                                <div className="justify-end grid grid-flow-col auto-cols-max gap-2 my-2">
                                    <Button data-test="delete-account" onClick={openModal} secondary>{t('Delete my account')}</Button>
                                    <Button data-test="save" onClick={handleSubmit} loading={isSaving}>{t('Save')}</Button>
                                </div>
                            )}
                        >
                            <Input
                                label={t('Email address')}
                                className="w-full my-4"
                                name="email"
                                value={email}
                                type="email"
                                disabled
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                                <Input
                                    label={t('First name')}
                                    className="w-full"
                                    name="firstName"
                                    value={firstName}
                                    onChange={handleChange}
                                    data-test="first-name"
                                    placeholder={t('Enter your first name')}
                                    type="text"
                                />

                                <Input
                                    label={t('Last name')}
                                    className="w-full"
                                    name="lastName"
                                    value={lastName}
                                    onChange={handleChange}
                                    data-test="last-name"
                                    placeholder={t('Enter your last name')}
                                    type="text"
                                />
                            </div>

                            <div className="my-4">
                                <p className="capitalize block text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 mb-1">{t('Payment informations')}</p>
                                <Button onClick={redirectToStripe} data-test="update-payment-informations" loading={isRedirecting} secondary>
                                    {t('Update payment informations')}
                                </Button>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};
