'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
