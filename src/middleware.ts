import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Block /admin completely — return 404
    if (pathname.startsWith('/admin')) {
        return NextResponse.rewrite(new URL('/not-found', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
