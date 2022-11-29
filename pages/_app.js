import '@styles/globals.css';
import Providers from '@lib/contexts';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    style: ['normal'],
    subsets: ['latin'],
});

export default ({ Component, pageProps }) => {
    const router = useRouter();

    return (
        <Providers>
            { /* eslint-disable react/no-unknown-property */}
            <style jsx global>
                {`
                    html {
                        font-family: ${roboto.style.fontFamily};
                    }
                `}
            </style>
            <Head>
                <title>Ethibox</title>
                <link rel="shortcut icon" href={`${router.basePath}/favicon.ico`} />
            </Head>
            <Component {...pageProps} />
        </Providers>
    );
};
