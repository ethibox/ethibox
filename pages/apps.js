import url from 'url';
import SidebarLayout from '@components/sidebarLayout';
import Confetti from '@components/confetti';
import Application from '@components/application';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { postQuery } from '@api/apps';
import { Button, Empty, Loading } from '@johackim/design-system';
import { useApi } from '@lib/contexts';
import { useTranslation } from 'react-i18next';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

export default ({ confetti }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const { data, isLoading } = useApi(`${router.basePath}/api/apps`);

    useEffect(() => {
        router.replace('/apps', undefined, { shallow: true });
    }, [router.query.session_id]);

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
                    title={t('No applications yet')}
                    subtitle={t('You can create your first application by clicking the button below')}
                    icon={<Squares2X2Icon className="w-20 m-auto text-gray-600" fille="none" />}
                    button={<Button onClick={() => router.push('/')} type="button">{t('Go to the store')}</Button>}
                />
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            { confetti && <Confetti /> }
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
                    <h2 className="mt-1 text-sm text-gray-500">{t('Manage your applications easily')}</h2>
                </div>

                <div className="container px-4 sm:px-6 md:px-8 my-10">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4 items-stretch">
                        {data.map((app) => <Application key={app.releaseName} {...app} />)}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export const getServerSideProps = async ({ req }) => {
    const sessionId = url.parse(req.url, true).query.session_id || null;

    if (!sessionId) return { props: {} };

    const res = {
        status: (status) => ({
            send: (data) => ({ ...data, status }),
        }),
    };

    await postQuery({ sessionId }, res);

    return { props: { confetti: true } };
};
