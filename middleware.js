import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const isAuthenticated = async (token, secret) => {
    try {
        if (token) {
            return await jwtVerify(token, new TextEncoder().encode(secret));
        }

        return false;
    } catch (err) {
        return false;
    }
};

export const config = {
    matcher: '/(api/(?!login|register|forgot|metrics).*)',
};

export default async (req) => {
    const headers = new Headers(req.headers);
    const token = headers.get('Authorization')?.split(' ')[1];

    const user = await isAuthenticated(token, process.env.JWT_SECRET);

    if (!process.env.STRIPE_SECRET_KEY) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Stripe secret key is not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }

    if (!user) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'You are not authenticated' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
    }

    const response = NextResponse.next();
    response.headers.set('email', user?.payload?.email);

    return response;
};
