import { Empty, Button, Table, Loading } from '@johackim/design-system';
import { useRouter } from 'next/router';
import { useApi } from '@lib/contexts';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon } from '@heroicons/react/outline';
import SidebarLayout from '@components/sidebarLayout';

export default () => {
    const router = useRouter();
    const { data, isLoading } = useApi(`${router.basePath}/api/invoices`);
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <SidebarLayout className="flex items-center justify-center">
                <Loading text={t('Loading...')} size="xl" />
            </SidebarLayout>
        );
    }

    if (!data?.length) {
        return (
            <SidebarLayout className="flex items-center justify-center">
                <Empty
                    title={t('No invoices')}
                    subtitle={t('You have no invoices yet')}
                    icon={<DocumentTextIcon className="w-20 m-auto text-gray-600" fille="none" />}
                    button={<Button onClick={() => router.push('/')} type="button">{t('Go to the store')}</Button>}
                />
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900">{t('Invoices')}</h1>
                    <h2 className="mt-1 text-sm text-gray-500">{t('A list of all your invoices')}</h2>
                </div>
            </div>

            <div className="container px-4 sm:px-6 md:px-8 pb-8">
                <Table
                    columns={[
                        t('Month'),
                        t('Year'),
                        t('Description'),
                        t('Status'),
                        t('Total'),
                        <span className="sr-only">View</span>,
                    ]}
                    rows={data.map(({ month, year, description, status, total, url }) => [
                        t(month),
                        t(year),
                        t(description),
                        t(status),
                        t(total),
                        <a href={url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
                            {t('View invoice')}
                        </a>,
                    ])}
                />
            </div>
        </SidebarLayout>
    );
};
