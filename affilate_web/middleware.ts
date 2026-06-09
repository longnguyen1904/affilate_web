import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('sb-access-token')?.value;
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin') && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/login') && token) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
};