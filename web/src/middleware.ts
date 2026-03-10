import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
        const adminToken = request.cookies.get('wfs_admin_token');
        if (!adminToken || adminToken.value !== 'authenticated') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
