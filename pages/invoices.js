import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config.mjs';
import { Button, Empty, Layout, Loading, Table, Notification } from '../components';

export default ({ stripeEnabled = false }) => {
    const router = useRouter();
    const { t, i18n } = useTranslation('common');
    const [invoices, setInvoices] = useState(null);
    const [notification, setNotification] = useState({ show: false, title: '', description: '', icon: null });

    useEffect(() => {
        fetch(`${router.basePath}/api/invoices`)
            .then((res) => {
                if (res.status === 401) router.push('/logout');

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                return res.json();
            })
            .then(setInvoices)
            .catch(() => {
                setNotification({
                    show: true,
                    title: 'Error',
                    description: 'Failed to load invoices. Please try again later.',
                    icon: Notification.XCircleIcon,
                });

                setInvoices([]);
            });
    }, []);

    if (!invoices) {
        return (
            <Layout stripeEnabled={stripeEnabled} className="flex items-center justify-center !px-0 !py-0">
                <Loading text={t('invoices.loading')} size="xl" />
            </Layout>
        );
    }

    if (invoices.length === 0) {
        return (
            <Layout stripeEnabled={stripeEnabled} className="flex items-center justify-center !px-0 !py-0">
                <Empty
                    title={t('invoices.empty.title')}
                    subtitle={t('invoices.empty.subtitle')}
                    icon={<DocumentTextIcon className="w-20 m-auto text-gray-600" fille="none" />}
                    button={<Link href="/" passHref><Button>{t('invoices.empty.button')}</Button></Link>}
                />

                <Notification
                    show={notification.show}
                    title={notification.title}
                    description={notification.description}
                    icon={notification.icon || Notification.CheckCircleIcon}
                    onClose={() => setNotification((s) => ({ ...s, show: false }))}
                />
            </Layout>
        );
    }

    return (
        <Layout stripeEnabled={stripeEnabled}>
            <h1 className="text-2xl font-semibold text-gray-900">{t('invoices.title')}</h1>
            <h2 className="mt-1 text-sm text-gray-500">{t('invoices.description')}</h2>

            <Table
                columns={[
                    t('invoices.table.number'),
                    t('invoices.table.date'),
                    t('invoices.table.description'),
                    t('invoices.table.total'),
                    t('invoices.table.status'),
                    <span className="sr-only">{t('invoices.table.view')}</span>,
                ]}
                rows={invoices.map((invoice) => ({
                    number: `#${invoice.number}`,
                    date: new Date(invoice.date).toLocaleDateString(i18n.language, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    description: invoice.description,
                    total: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: invoice.currency }).format(invoice.total),
                    status: (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {t(`invoices.status.${invoice.status}`)}
                        </span>
                    ),
                    view: (
                        <Link href={invoice.url} target="_blank" passHref>
                            <Button className="!px-2.5 !py-1.5" secondary>
                                {t('invoices.table.view')}
                            </Button>
                        </Link>
                    ),
                }))}
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
