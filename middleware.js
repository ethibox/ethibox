import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { DEFAULT_LOCALE, NEXT_PUBLIC_BASE_PATH } from './lib/constants';

const isAuthenticated = async (token, secret) => {
    try {
        if (!token) return null;

        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

        return payload;
    } catch (_) {
        return null;
    }
};

// eslint-disable-next-line complexity
export default async (req) => {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith(`${NEXT_PUBLIC_BASE_PATH}/_next`) || /\.(.*)$/.test(pathname)) {
        return NextResponse.next();
    }

    const token = req.cookies.get('token')?.value;
    const payload = await isAuthenticated(token, process.env.JWT_SECRET);
    const isAuth = Boolean(payload);

    const locale = req.nextUrl.locale || DEFAULT_LOCALE;
    const base = NEXT_PUBLIC_BASE_PATH + (locale === DEFAULT_LOCALE ? '' : `/${locale}`);
    const path = pathname.replace(new RegExp(`^${base}(?=/|$)`), '').replace(/\/$/, '') || '/';

    if (!isAuth && ['/', '/apps', '/settings', '/invoices'].includes(path)) {
        return NextResponse.redirect(new URL(`${base}/login`, req.nextUrl));
    }
    if (isAuth && ['/login', '/register', '/forgot', '/reset-password'].includes(path)) {
        return NextResponse.redirect(new URL(`${base}/`, req.nextUrl));
    }

    const headers = new Headers(req.headers);

    if (isAuth) {
        headers.set('x-user-email', payload.email);
    } else {
        headers.delete('x-user-email');
    }

    return NextResponse.next({ request: { headers } });
};
