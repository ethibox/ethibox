import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Squares2X2Icon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button, Empty, Layout, Modal, Input, Loading, Select, ProgressBar, Notification, Confetti } from '../components';
import nextI18nextConfig from '../next-i18next.config.mjs';
import { STATE } from '../lib/constants';

const SettingsModal = ({ app, open, onClose, onSaved, onError, onUninstall }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setHasChanges(false);
    }, [app]);

    const onSubmit = async (e) => {
        setLoading(true);

        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const domain = formData.get('domain');
        const envs = app.envs.map(({ name, value, ...rest }) => ({ name, value: formData.get(name) || value, ...rest }));

        fetch(`${router.basePath}/api/apps`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ releaseName: app.releaseName, domain, envs }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const { message } = await res.json();
                    throw new Error(message || 'Failed to save settings');
                }
                onClose();
                onSaved(envs, domain);
            })
            .catch(({ message }) => {
                onError(t('apps.error.title'), message);
            }).finally(() => {
                setLoading(false);
            });
    };

    const initialData = [app?.domain ?? '', ...(app?.envs || []).map((e) => e.value ?? '')];

    const handleChange = (e) => {
        if (!app) return;

        const fd = new FormData(e.currentTarget);
        const values = Object.fromEntries(fd.entries());

        const data = [
            values.domain ?? '',
            ...(app.envs || []).map(({ name, disabled, value }) => (disabled ? (value ?? '') : (values[name] ?? ''))),
        ];

        setHasChanges(JSON.stringify(data) !== JSON.stringify(initialData));
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Modal.Header>
                <Modal.Dropdown items={[{ text: t('apps.settings.modal.uninstall'), icon: Modal.TrashIcon, onClick: onUninstall }]} />
                <Modal.Title>{t('apps.settings.modal.title', { name: app?.name })}</Modal.Title>
                <Modal.Description>{t('apps.settings.modal.description')}</Modal.Description>
            </Modal.Header>
            <form id="app-settings-form" onSubmit={onSubmit} onChange={handleChange} className="px-4 sm:px-6">
                <Input id="domain" name="domain" label={t('apps.settings.modal.domainLabel')} prefix="https://" defaultValue={app?.domain} className="mb-4" data-test="app-domain" />
                {app?.envs?.map((env) => (
                    env.type === 'select' ? (
                        <Select
                            id={env.name}
                            key={env.name}
                            name={env.name}
                            className="mb-4"
                            label={env.label}
                            defaultValue={env.value}
                            data-test={`app-env-${env.name}`}
                        >
                            {env.select.map((s) => (
                                <option key={s.name} value={s.value}>{s.name}</option>
                            ))}
                        </Select>
                    ) : (
                        <Input
                            id={env.name}
                            key={env.name}
                            name={env.name}
                            className="mb-4"
                            label={env.label}
                            defaultValue={env.value}
                            type={env.type || 'text'}
                            data-test={`app-env-${env.name}`}
                            disabled={env.disabled || false}
                        />
                    )
                ))}
            </form>
            <Modal.Footer>
                <Button type="submit" loading={loading} disabled={!hasChanges} loadingText={t('apps.loadingStates.updating')} form="app-settings-form">{t('apps.settings.modal.update')}</Button>
                <Button onClick={onClose} className="bg-white" secondary>{t('apps.settings.modal.back')}</Button>
            </Modal.Footer>
        </Modal>
    );
};

const ConfirmDeleteModal = ({ app, open, onClose, onConfirm, onError }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const onConfirmDelete = async () => {
        setLoading(true);
        fetch(`${router.basePath}/api/apps`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': router.locale },
            body: JSON.stringify({ releaseName: app.releaseName }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const { message } = await res.json();
                    throw new Error(message || 'Failed to delete application');
                }
                onConfirm(app.releaseName);
                onClose();
            })
            .catch(({ message }) => {
                onError('Error', message);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Modal.Header icon={Modal.ExclamationTriangleIcon}>
                <Modal.Title>{t('apps.delete.modal.title')}</Modal.Title>
                <Modal.Description>
                    {t('apps.delete.modal.description')}
                    <br />
                    <br />
                    <b>{t('apps.delete.modal.question')}</b>
                </Modal.Description>
            </Modal.Header>
            <Modal.Footer>
                <Button onClick={onConfirmDelete} loading={loading} loadingText={t('apps.loadingStates.deleting')} className="!bg-red-500 hover:!bg-red-600 disabled:hover:!bg-red-500" data-test="uninstall">{t('apps.delete.modal.uninstall')}</Button>
                <Button onClick={onClose} className="bg-white" secondary>{t('apps.delete.modal.cancel')}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ({ stripeEnabled = false }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [apps, setApps] = useState(null);
    const [currentApp, setCurrentApp] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        fetch(`${router.basePath}/api/apps`)
            .then((res) => res.json())
            .then((data) => setApps(data?.apps || []))
            .catch(() => setApps([]));
    }, []);

    useEffect(() => {
        if (!apps) return;

        const releaseName = router.query.edit;
        const selectedApp = apps.find((a) => a.releaseName === releaseName);

        setCurrentApp(selectedApp);
        setModalOpen(!!selectedApp && !isConfirmOpen);
    }, [router.query.edit, apps, isConfirmOpen]);

    useEffect(() => {
        if (notification.show && notification.icon === Notification.CheckCircleIcon) {
            const timer = setTimeout(() => {
                setNotification((s) => ({ ...s, show: false }));
            }, 3000);

            return () => clearTimeout(timer);
        }

        return undefined;
    }, [notification.show, notification.icon]);

    useEffect(() => {
        if (router.query.installed) {
            setShowConfetti(true);
            router.replace('/apps', undefined, { shallow: true });
        }
    }, [router.query.installed]);

    if (apps === null) {
        return (
            <Layout stripeEnabled={stripeEnabled} className="flex items-center justify-center !px-0 !py-0">
                <Loading text={t('apps.loading')} size="xl" />
            </Layout>
        );
    }

    if (!apps.length) {
        return (
            <Layout stripeEnabled={stripeEnabled} className="flex items-center justify-center !px-0 !py-0">
                <Notification
                    show={notification.show}
                    title={notification.title}
                    description={notification.description}
                    icon={notification.icon}
                    onClose={() => setNotification((s) => ({ ...s, show: false }))}
                />
                <Empty
                    title={t('apps.empty.title')}
                    subtitle={t('apps.empty.subtitle')}
                    icon={<Squares2X2Icon className="w-20 m-auto text-gray-600" fille="none" />}
                    button={<Link href="/" passHref><Button>{t('apps.empty.button')}</Button></Link>}
                />
            </Layout>
        );
    }

    return (
        <Layout stripeEnabled={stripeEnabled}>
            <Confetti show={showConfetti} numberOfPieces={500} recycle={false} gravity={0.4} />
            <Notification
                show={notification.show}
                icon={notification.icon}
                title={notification.title}
                description={notification.description}
                onClose={() => setNotification((s) => ({ ...s, show: false }))}
            />

            <h1 className="text-2xl font-semibold text-gray-900">{t('apps.title')}</h1>
            <h2 className="mt-1 text-sm text-gray-500">{t('apps.description')}</h2>

            <div className="container my-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                    {apps.map(({ releaseName, name, category, logo, domain, state, updatedAt }) => (
                        <div key={releaseName} data-test="app" className="overflow-hidden rounded-lg bg-white shadow-sm relative">
                            {[STATE.STANDBY, STATE.WAITING].includes(state) && <ProgressBar updatedAt={updatedAt} text={t('apps.progress')} />}
                            <div className="px-4 py-5">
                                <span className="text-sm text-gray-700 float-right">
                                    <img src={encodeURI(logo)} className="w-14 h-14" alt={name} />
                                </span>
                                <p className="text-sm font-semibold block">{name}</p>
                                <p className="text-sm text-gray-500">{category}</p>

                                <div className="flex mt-4">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 mr-1" />
                                    <Link href={`https://${encodeURI(domain)}`} target="_blank" className="text-xs underline" rel="noreferrer">{`https://${domain}`}</Link>
                                </div>
                            </div>

                            <div className="p-4">
                                <Button
                                    className="w-full"
                                    onClick={() => router.push(`/apps?edit=${releaseName}`, undefined, { shallow: true })}
                                    data-test="app-settings"
                                    secondary
                                >
                                    {t('apps.settings.button')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SettingsModal
                app={currentApp}
                open={isModalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setTimeout(() => router.push('/apps', undefined, { shallow: true }), 200);
                }}
                onSaved={(envs, domain) => {
                    setApps((prev) => prev.map((a) => (a.releaseName === currentApp.releaseName ? { ...a, envs, domain, state: STATE.STANDBY, updatedAt: new Date() } : a)));
                    setTimeout(() => {
                        setNotification({
                            show: true,
                            title: t('apps.notifications.updated.title'),
                            description: t('apps.notifications.updated.description'),
                            icon: Notification.CheckCircleIcon,
                        });
                    }, 500);
                }}
                onUninstall={() => {
                    setModalOpen(false);
                    setConfirmOpen(true);
                }}
                onError={(title, description) => {
                    setNotification({
                        show: true,
                        title,
                        description,
                        icon: Notification.XCircleIcon,
                    });
                }}
            />

            <ConfirmDeleteModal
                app={currentApp}
                open={isConfirmOpen}
                onClose={() => {
                    setConfirmOpen(false);
                    setModalOpen(true);
                }}
                onConfirm={(releaseName) => {
                    setConfirmOpen(false);
                    setApps((prev) => prev.filter((a) => a.releaseName !== releaseName));
                    setNotification({
                        show: true,
                        title: t('apps.notifications.uninstalled.title'),
                        description: t('apps.notifications.uninstalled.description'),
                        icon: Notification.CheckCircleIcon,
                    });
                    router.push('/apps', undefined, { shallow: true });
                }}
                onError={(title, description) => {
                    setNotification({
                        show: true,
                        title,
                        description,
                        icon: Notification.XCircleIcon,
                    });
                }}
            />
        </Layout>
    );
};

export const getServerSideProps = async ({ locale }) => ({
    props: {
        stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
        ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
    },
});
