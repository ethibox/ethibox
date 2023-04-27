import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { ModalProvider, NotificationProvider, useNotification } from '@johackim/design-system';
import i18n from '@lib/i18n';
import decode from 'jwt-decode';

export const AuthContext = createContext({
    user: {},
    login: () => {},
    logout: () => {},
    isLoggedIn: false,
});

export const ApiContext = createContext({
    data: {},
    error: false,
    setData: () => {},
    isLoading: true,
});

export const FormContext = createContext({
    data: {},
    setData: () => {},
});

export const FormProvider = ({ children }) => {
    const [data, setData] = useState({});
    const [initialData, setInitialData] = useState({});
    const [isUpdated, setUpdated] = useState(false);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        setData(initialData);
        setUpdated(false);
    }, [initialData]);

    useEffect(() => {
        setUpdated(JSON.stringify(data) !== JSON.stringify(initialData));
    }, [data]);

    const value = useMemo(() => ({
        data,
        isUpdated,
        isLoading,
        setData,
        setInitialData,
        setLoading,
    }), [data, isUpdated, isLoading]);

    return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const IntlProvider = ({ children }) => {
    const translation = useTranslation();
    const router = useRouter();

    useEffect(() => {
        if (window.Cypress) return;
        translation.i18n.changeLanguage(router.locale);
    }, [router.locale]);

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
};

export const ApiProvider = ({ children }) => {
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);

    const value = useMemo(() => ({ data, isLoading, setLoading, setData }), [data, isLoading]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

/* eslint-disable max-lines-per-function */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        if (typeof window === 'undefined') return {};

        const token = localStorage.getItem('token');

        if (!token) return {};

        const { exp = false } = token && decode(token);
        const now = Math.floor(Date.now() / 1000);

        if (now < exp) return { token, ...decode(token) };

        return {};
    });

    const login = (token) => {
        localStorage.setItem('token', token);
        const data = decode(token);
        setUser({ token, ...data });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser({});
    };

    const isLoggedIn = useMemo(() => {
        if (typeof window === 'undefined') return false;

        const token = localStorage.getItem('token');
        if (!token) return false;

        const { exp = false } = token && decode(token);
        const now = Math.floor(Date.now() / 1000);
        return now < exp;
    }, [user]);

    const value = useMemo(() => ({ user, login, logout, isLoggedIn }), [user, login, logout, isLoggedIn]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useForm = () => useContext(FormContext);

export const useAuth = () => useContext(AuthContext);

export const useApi = (url, method = 'GET') => {
    const { data, setData, isLoading, setLoading } = useContext(ApiContext);
    const { user } = useContext(AuthContext);
    const { t } = useTranslation();
    const notification = useNotification();
    const router = useRouter();
    const abortController = new AbortController();

    useEffect(() => {
        if (router.query.refresh) router.replace(router.pathname);
        setLoading(true);

        fetch(url, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
            signal: abortController.signal,
            method,
        })
            .then(async (res) => {
                if (res.status !== 200) {
                    const { message } = await res.json();
                    throw new Error(message);
                }

                return res;
            })
            .then((res) => res.json())
            .then((res) => {
                setData(Object.values(res)[0]);
                setLoading(false);
            })
            .catch((res) => {
                if (res.name === 'AbortError') return;
                notification.add({ title: t('Error'), text: t(res.message), type: 'error', timeout: 5 });
                setLoading(false);
            });

        return () => {
            abortController.abort();
        };
    }, [router.query.refresh]);

    return { data, setData, isLoading };
};

const Compose = ({ components, children }) => (
    components.reduceRight((acc, Comp) => <Comp>{acc}</Comp>, children)
);

export default ({ children }) => (
    <Compose components={Object.values({ AuthProvider, ApiProvider, IntlProvider, FormProvider, ModalProvider, NotificationProvider })}>
        {children}
    </Compose>
);
