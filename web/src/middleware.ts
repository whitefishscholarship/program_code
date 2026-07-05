import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminAuth';

// Admin pages reachable WITHOUT a session: the login page and the password-recovery
// page (which exists precisely for a locked-out admin — gating it made it a dead feature).
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/recover']);

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isAdminPage = path.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.has(path);
    const isAdminApi = path.startsWith('/api/admin');
    if (isAdminPage || isAdminApi) {
        const token = request.cookies.get(ADMIN_COOKIE)?.value;
        if (!(await verifyAdminToken(token))) {
            // API gets a 401; pages get redirected to login. (Routes also self-gate;
            // this is defense-in-depth so a new /api/admin/* route is protected by default.)
            return isAdminApi
                ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                : NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
