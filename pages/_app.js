import '../styles/globals.css';
import Head from 'next/head';
import { Roboto } from 'next/font/google';
import { appWithTranslation } from 'next-i18next';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    style: ['normal'],
    subsets: ['latin'],
});

const App = ({ Component, pageProps }) => (
    <>
        {/* eslint-disable react/no-unknown-property */}
        <style jsx global>
            {`
                html {
                    font-family: ${roboto.style.fontFamily};
                }
            `}
        </style>
        <Head>
            <title>Ethibox</title>
        </Head>
        <Component {...pageProps} />
    </>
);

export default appWithTranslation(App);
