import { Card, Button, Link, Dropdown, Input, Select, useModal, useNotification } from '@johackim/design-system';
import { useRouter } from 'next/router';
import { useAuth, useForm, FormContext } from '@lib/contexts';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Percentage from '@components/percentage';

export default (app) => {
    const { t } = useTranslation();
    const auth = useAuth();
    const modal = useModal();
    const router = useRouter();
    const notification = useNotification();
    const { setData, setInitialData, setLoading } = useForm();
    const { name, releaseName, domain, category, updatedAt, logo } = app;

    const handleChange = (e) => {
        setData((a) => ({
            ...a,
            ...(a.envs.find((env) => env.name === e.target.name) ? {} : { [e.target.name]: e.target.value }),
            envs: a.envs.map((env) => {
                if (env.name === e.target.name) {
                    return { ...env, value: e.target.value || null };
                }

                return env;
            }),
        }));
    };

    const update = async () => {
        setLoading(true);

        setData((a) => {
            fetch(`${router.basePath}/api/apps`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
                body: JSON.stringify(a),
            })
                .then((res) => res.json())
                .then(({ success, message }) => {
                    if (success) {
                        notification.add({ title: t(`${name} App Settings`), text: t('Settings saved successfully'), timeout: 5 });
                        modal.remove('app-settings');
                        router.push('/apps?refresh=true');
                    } else {
                        notification.add({ title: t('Error'), text: t(message), type: 'error', timeout: 30 });
                    }
                }).catch((e) => {
                    notification.add({ title: t('Error'), text: t(e.message), type: 'error' });
                })
                .finally(() => {
                    setLoading(false);
                });

            return a;
        });
    };

    const uninstall = async (confirm) => {
        modal.remove('app-settings');

        if (confirm === true) {
            setLoading(true);

            await fetch(`${router.basePath}/api/apps`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
                body: JSON.stringify({ releaseName }),
            }).finally(() => setLoading(false));

            notification.add({ title: t('Application'), text: t('App uninstalled'), type: 'success', timeout: 5 });
            modal.remove('uninstall-app');
            router.push('/apps?refresh=true');

            return;
        }

        modal.add({
            id: 'uninstall-app',
            title: t('Confirm Application Deletion'),
            children: (
                <>
                    <p className="py-2">{t("By deleting your application, you will also delete all your application's data and cancel your billing associated.")}</p>
                    <p className="py-2 font-bold">{t('Are you sure you want to uninstall your application?')}</p>
                </>
            ),
            footer: (
                <FormContext.Consumer>
                    {({ isLoading }) => (
                        <>
                            <Button onClick={() => modal.remove('uninstall-app')} className="!bg-white" secondary>{t('Cancel')}</Button>
                            <Button onClick={() => uninstall(true)} className="!bg-red-700 hover:!bg-red-800 disabled:hover:!bg-red-700" data-test="confirm-uninstall-app" loading={isLoading}>{t('Uninstall')}</Button>
                        </>
                    )}
                </FormContext.Consumer>
            ),
        });
    };

    const openSettings = () => {
        setInitialData(app);
        setData(app);

        modal.add({
            id: 'app-settings',
            title: t('Manage your application', { name }),
            description: t('You can change your application settings here'),
            header: (
                <span className="text-sm float-right">
                    <Dropdown data-test="settings-dropdown" dots>
                        <div className="py-1">
                            <button onClick={uninstall} type="button" data-test="uninstall-app" className="flex items-center w-full text-left px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
                                <TrashIcon className="mr-3 h-5 w-5 text-gray-400" />
                                <span>{t('Uninstall application')}</span>
                            </button>
                        </div>
                    </Dropdown>
                </span>
            ),
            children: (
                <FormContext.Consumer>
                    {({ data }) => (
                        <div className="mt-6">
                            <Input
                                id={`${releaseName}-domain`}
                                label={t('Domain name')}
                                data-test="app-domain"
                                className="w-full"
                                onChange={handleChange}
                                name="domain"
                                value={data.domain}
                                addOn="https://"
                            />
                            {(data?.envs || []).map((env) => (
                                env.type === 'select' ? (
                                    <Select
                                        id={`${releaseName}-${env.name}`}
                                        key={env.name}
                                        label={env.label}
                                        data-test={`app-env-${env.name.toLowerCase()}`}
                                        className="w-full mt-4"
                                        placeholder=" "
                                        onChange={handleChange}
                                        name={env.name}
                                        value={env.value}
                                        options={env.select}
                                    />
                                ) : (
                                    <Input
                                        id={`${releaseName}-${env.name}`}
                                        data-test={`app-env-${env.name.toLowerCase()}`}
                                        className="w-full mt-4"
                                        placeholder=" "
                                        onChange={handleChange}
                                        type={env.type || 'text'}
                                        showPassword
                                        {...env}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </FormContext.Consumer>
            ),
            footer: (
                <FormContext.Consumer>
                    {({ isUpdated, isLoading }) => (
                        <>
                            <Button onClick={() => modal.remove('app-settings')} className="!bg-white" secondary>{t('Cancel')}</Button>
                            <Button onClick={update} data-test="save-app-settings" disabled={!isUpdated} loading={isLoading}>{t('Update')}</Button>
                        </>
                    )}
                </FormContext.Consumer>
            ),
        });
    };

    return (
        <Card
            key={releaseName}
            name={name}
            value={category}
            data-test="app"
            header={(
                <span className="text-sm text-gray-700 dark:text-gray-300 float-right">
                    <img src={logo} className="w-14 h-14" alt="logo" />
                </span>
            )}
            small
        >
            <Percentage updatedAt={updatedAt} />
            <div className="flex">
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 mr-1" />
                <Link href={`https://${domain}`} target="_blank" className="text-xs underline">{`https://${domain}`}</Link>
            </div>
            <div className="mt-8">
                <Button onClick={openSettings} data-test="app-settings" className="w-full" secondary>{t('Settings')}</Button>
            </div>
        </Card>
    );
};
