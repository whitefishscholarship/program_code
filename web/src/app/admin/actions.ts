'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { Resend } from 'resend';

export async function loginToAdmin(formData: FormData) {
    const password = formData.get('password');

    // Expected passphrase set by admin specification
    if (password === 'WhitefishHS!') {
        const cookieStore = await cookies();
        cookieStore.set('wfs_admin_token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 Week
            path: '/admin',
        });

        // Redirect deep into the admin dashboard on success
        redirect('/admin');
    }

    // Since this is a simple Server Action, we return an error message to the client on failure
    return { error: 'Invalid access code.' };
}

export async function initiatePasswordRecovery() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        return { error: 'Admin email not configured in environment variables. Contact support.' };
    }

    // Generate random 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const secret = process.env.JWT_SECRET || 'fallback_dev_secret_wfs';

    const hash = crypto.createHash('sha256').update(pin + secret).digest('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store secure ephemeral hash in cookies
    const cookieStore = await cookies();
    cookieStore.set('wfs_recovery_hash', `${hash}.${expires}`, {
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
                subject: 'Admin Dashboard Recovery PIN',
                text: `Your one-time recovery PIN is: ${pin}\n\nThis PIN expires in 15 minutes. If you did not request this, please ignore it.`,
            });
            return { success: true };
        } catch (error: any) {
            console.error('Resend Error:', error);
            return { error: 'Failed to send recovery email via Resend.' };
        }
    } else {
        // Dev Fallback - print to console if no email provider is configured
        console.log(`\n\n[DEV MODE] Password Recovery PIN generated for ${adminEmail}: ${pin}\n\n`);
        return { success: true };
    }
}

export async function validateRecoveryPin(formData: FormData) {
    const pin = formData.get('pin')?.toString();
    if (!pin) return { error: 'PIN is required.' };

    const cookieStore = await cookies();
    const hashSession = cookieStore.get('wfs_recovery_hash')?.value;

    if (!hashSession) return { error: 'Recovery session expired or not found. Please request a new PIN.' };

    const [storedHash, expiresStr] = hashSession.split('.');
    if (Date.now() > parseInt(expiresStr, 10)) {
        return { error: 'Recovery PIN has expired. Please request a new one.' };
    }

    const secret = process.env.JWT_SECRET || 'fallback_dev_secret_wfs';
    const computedHash = crypto.createHash('sha256').update(pin + secret).digest('hex');

    if (computedHash === storedHash) {
        // Success: Grant full Admin access cookie
        cookieStore.set('wfs_admin_token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 Week
            path: '/admin',
        });
        cookieStore.delete('wfs_recovery_hash');

        // Wait until return to redirect to avoid Next.js error catching
        return { success: true, redirectUrl: '/admin' };
    } else {
        return { error: 'Invalid PIN.' };
    }
}
