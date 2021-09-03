import React from 'react';
import { RecoilRoot, useRecoilValueLoadable } from 'recoil';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { IntlProvider } from 'gatsby-plugin-intl';
import { NotificationProvider } from './src/context/NotificationContext';
import { ModalProvider } from './src/context/ModalContext';

import Loader from './src/components/loaders/loader';
import { isLoggedIn, removeToken, redirect } from './src/utils';
import { stripeState } from './src/atoms';

import './src/style.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, logout: false };
    }

    static getDerivedStateFromError(error) {
        if (isLoggedIn() && error.message === 'Not authorized') {
            return { hasError: true, logout: true };
        }

        return { hasError: true };
    }

    render() {
        const { hasError, logout } = this.state;
        const { children } = this.props;

        if (logout) {
            removeToken();
            redirect('/login');
            return <div>Redirect...</div>;
        }

        if (hasError) {
            return <h1>Something went wrong.</h1>;
        }

        return children;
    }
}

const UserComponent = ({ children }) => {
    const stripeLoadable = useRecoilValueLoadable(stripeState);
    const { contents: stripeConfig } = stripeLoadable;
    const { stripePublishableKey, stripeEnabled } = stripeConfig;

    if (stripeLoadable.hasError || !stripeEnabled || !stripePublishableKey) {
        return (
            <Elements stripe={null}>
                {children}
            </Elements>
        );
    }

    if (stripeLoadable.state === 'loading') {
        return <Loader />;
    }

    return (
        <Elements stripe={loadStripe(stripePublishableKey)}>
            {children}
        </Elements>
    );
};

export const wrapRootElement = ({ element }) => {
    return (
        <RecoilRoot>
            <ErrorBoundary>
                <IntlProvider>
                    <ModalProvider>
                        <NotificationProvider>
                            { isLoggedIn() ? (
                                <UserComponent>
                                    {element}
                                </UserComponent>
                            ) : element }
                        </NotificationProvider>
                    </ModalProvider>
                </IntlProvider>
            </ErrorBoundary>
        </RecoilRoot>
    );
};
