import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminAuth';

// Revalidate the /api/scholarships ISR cache after a sheet edit. Previously this was an
// UNAUTHENTICATED GET, so anyone could loop it to defeat the 5-minute cache that exists to
// protect the Google Sheets API quota (a cheap quota-drain / DoS vector). It now requires
// EITHER a valid admin session cookie OR a ?secret= that matches REVALIDATE_SECRET (for an
// automated caller such as a Google Apps Script onEdit trigger). If you drive this from an
// unauthenticated automation, set REVALIDATE_SECRET in the environment and pass ?secret=.
export async function GET(req: NextRequest) {
    const secret = process.env.REVALIDATE_SECRET;
    const provided = req.nextUrl.searchParams.get('secret');
    const bySecret = !!secret && provided === secret;
    const byCookie = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!bySecret && !byCookie) {
        return NextResponse.json({ revalidated: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        revalidatePath('/api/scholarships');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err: unknown) {
        console.error('Revalidate error:', err instanceof Error ? err.message : String(err));
        return NextResponse.json({ revalidated: false, error: 'Revalidation failed' }, { status: 500 });
    }
}
