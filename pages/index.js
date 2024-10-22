import { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Link, useNotification } from '@johackim/design-system';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@lib/contexts';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@components/sidebarLayout';

export default (props) => {
    const auth = useAuth();
    const notification = useNotification();
    const [templates, setTemplates] = useState(props.templates); // eslint-disable-line
    const { basePath, locale } = useRouter();
    const { t } = useTranslation();

    const install = (name) => {
        if (templates.find((temp) => temp.isLoading)) return;

        setTemplates(templates.map((temp) => (temp.name === name ? { ...temp, isLoading: true } : temp)));

        const baseUrl = `${window.location.protocol}//${window.location.host}${basePath}/${locale}`;

        fetch(`${basePath}/api/stripe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.user?.token}` },
            body: JSON.stringify({ baseUrl, name, locale }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.url && window.Cypress === undefined) {
                    window.location.replace(data.url);
                } else {
                    notification.add({ title: t('Error'), text: t(data.message), type: 'error', timeout: 5 });
                    setTemplates(templates.map((temp) => (temp.name === name ? { ...temp, isLoading: false } : temp)));
                }
            });
    };

    return (
        <SidebarLayout>
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900">{t('Application Store')}</h1>
                    <h2 className="mt-1 text-sm text-gray-500">{t('A selection of the best open-source applications')}</h2>
                </div>

                <div className="container px-4 sm:px-6 md:px-8 my-10">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                        {templates.map(({ name, logo, category, website, isLoading }) => (
                            <Card
                                key={name}
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
                                <div className="flex">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 mr-1" />
                                    <Link href={website} target="_blank" className="text-xs underline">{t('More infos')}</Link>
                                </div>
                                <div className="mt-10">
                                    <Button onClick={() => install(name)} data-test="install-app" className="w-full" loading={isLoading} secondary>
                                        {t('Install application')}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export const getStaticProps = async () => {
    const { TEMPLATES_URL } = process.env;

    const templates = ((await fetch(TEMPLATES_URL).then((res) => res.json())).templates || [])
        .map(({ title, categories, ...rest }) => ({ name: title, category: categories[0], ...rest }))
        .filter(({ enabled }) => enabled);

    return {
        props: { templates },
        revalidate: 86400,
    };
};
