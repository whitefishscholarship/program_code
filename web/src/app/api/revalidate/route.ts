import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        revalidatePath('/api/scholarships');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err: unknown) {
        return NextResponse.json({ revalidated: false, message: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
