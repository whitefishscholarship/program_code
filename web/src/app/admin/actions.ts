'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { Resend } from 'resend';
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE_SECONDS, createAdminToken } from '@/lib/adminAuth';

async function setAdminSession() {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, await createAdminToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS, // 1 Week
        // Widened from '/admin' to '/' so the cookie is also sent to /api/admin/* routes.
        path: '/',
    });
}

export async function loginToAdmin(formData: FormData) {
    const password = formData.get('password');

    // Passphrase comes from the ADMIN_PASSWORD env var, never hard-coded.
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
        return { error: 'Admin password is not configured. Set ADMIN_PASSWORD in the environment.' };
    }

    // Constant-time comparison (hash both sides to a fixed length so neither the password
    // length nor a prefix match leaks via response timing).
    const sha = (s: string) => crypto.createHash('sha256').update(s).digest();
    if (typeof password === 'string' && crypto.timingSafeEqual(sha(password), sha(expected))) {
        await setAdminSession();
        // Redirect deep into the admin dashboard on success
        redirect('/admin');
    }

    // Since this is a simple Server Action, we return an error message to the client on failure
    return { error: 'Invalid access code.' };
}

// Max validate attempts per issued recovery code before it is invalidated. Defense in
// depth on top of the code's own entropy — the recovery cookie carries the attempt count.
const RECOVERY_MAX_ATTEMPTS = 5;

export async function initiatePasswordRecovery() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        return { error: 'Admin email not configured in environment variables. Contact support.' };
    }

    // High-entropy recovery code from a CSPRNG. A short 6-digit PIN (900k space) generated
    // with Math.random() was brute-forceable because the validate endpoint has no server-side
    // rate limit; a ~72-bit base64url code is not enumerable regardless of request volume.
    const code = crypto.randomBytes(9).toString('base64url');
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set.');

    const hash = crypto.createHash('sha256').update(code + secret).digest('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store secure ephemeral hash + attempt counter (starts at 0) in an httpOnly cookie.
    const cookieStore = await cookies();
    cookieStore.set('wfs_recovery_hash', `${hash}.${expires}.0`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/admin',
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
        try {
            const resend = new Resend(resendKey);
            await resend.emails.send({
                from: 'Whitefish Scholarships <onboarding@resend.dev>',
                to: adminEmail,
                subject: 'Admin Dashboard Recovery Code',
                text: `Your one-time recovery code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, please ignore it.`,
            });
            return { success: true };
        } catch (error: any) {
            console.error('Resend Error:', error);
            return { error: 'Failed to send recovery email via Resend.' };
        }
    } else {
        // Dev Fallback - print to console if no email provider is configured
        console.log(`\n\n[DEV MODE] Password Recovery code generated for ${adminEmail}: ${code}\n\n`);
        return { success: true };
    }
}

export async function validateRecoveryPin(formData: FormData) {
    const code = formData.get('pin')?.toString();
    if (!code) return { error: 'Recovery code is required.' };

    const cookieStore = await cookies();
    const cookieOpts = {
        httpOnly: true as const,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 15 * 60,
        path: '/admin',
    };
    const hashSession = cookieStore.get('wfs_recovery_hash')?.value;

    if (!hashSession) return { error: 'Recovery session expired or not found. Please request a new code.' };

    const [storedHash, expiresStr, attemptsStr] = hashSession.split('.');
    if (!storedHash || Date.now() > parseInt(expiresStr, 10)) {
        cookieStore.delete('wfs_recovery_hash');
        return { error: 'Recovery code has expired. Please request a new one.' };
    }

    const attempts = parseInt(attemptsStr || '0', 10) || 0;
    if (attempts >= RECOVERY_MAX_ATTEMPTS) {
        cookieStore.delete('wfs_recovery_hash');
        return { error: 'Too many attempts. Please request a new recovery code.' };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set.');
    const computedHash = crypto.createHash('sha256').update(code + secret).digest('hex');

    const match =
        computedHash.length === storedHash.length &&
        crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));

    if (match) {
        // Success: Grant full Admin access cookie (signed token, path '/').
        await setAdminSession();
        cookieStore.delete('wfs_recovery_hash');
        // Wait until return to redirect to avoid Next.js error catching
        return { success: true, redirectUrl: '/admin' };
    }

    // Wrong code — burn one attempt; invalidate the code once the cap is hit.
    const remaining = RECOVERY_MAX_ATTEMPTS - (attempts + 1);
    if (remaining <= 0) {
        cookieStore.delete('wfs_recovery_hash');
        return { error: 'Too many attempts. Please request a new recovery code.' };
    }
    cookieStore.set('wfs_recovery_hash', `${storedHash}.${expiresStr}.${attempts + 1}`, cookieOpts);
    return { error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
}
