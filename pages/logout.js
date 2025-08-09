import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config.mjs';
import Loading from '../components/loading';

export default () => {
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        const doLogout = async () => {
            fetch(`${router.basePath}/api/logout`, {
                method: 'POST',
            }).then(() => {
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            });
        };

        doLogout();
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="flex justify-center items-center">
                <Loading text={t('logout.loading')} size="xl" />
            </div>
        </div>
    );
};

export const getStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
    },
});
