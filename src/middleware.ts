import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Block /admin completely — return 404
    if (pathname.startsWith('/admin')) {
        return NextResponse.rewrite(new URL('/not-found', req.url));
    }

    // Protect /enlighten-panel routes (except login)
    if (pathname.startsWith('/enlighten-panel') && !pathname.startsWith('/enlighten-panel/login')) {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (token?.role !== 'admin') {
            const loginUrl = new URL('/enlighten-panel/login', req.url);
            loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/enlighten-panel/:path*'],
};
