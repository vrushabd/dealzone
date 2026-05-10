import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Block /admin completely — return 404
    if (pathname.startsWith('/admin')) {
        return NextResponse.rewrite(new URL('/not-found', req.url));
    }

    // Protect /enlightenment-panel routes (except login)
    if (pathname.startsWith('/enlightenment-panel') && !pathname.startsWith('/enlightenment-panel/login')) {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (token?.role !== 'admin') {
            const loginUrl = new URL('/enlightenment-panel/login', req.url);
            loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/enlightenment-panel/:path*'],
};
