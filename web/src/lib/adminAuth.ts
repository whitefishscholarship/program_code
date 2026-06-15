// Shared admin-session token helpers.
//
// Designed to run in BOTH the Node runtime (server actions, API route handlers)
// AND the Edge runtime (middleware). It therefore uses only Web Crypto
// (`crypto.subtle`) and `btoa` — no Node `Buffer` or `node:crypto`, which are
// unavailable on Edge.
//
// The cookie value is a signed token `admin.<expiryMs>.<hmac>` rather than a
// static string, so it cannot be forged without the server secret.

export const ADMIN_COOKIE = 'wfs_admin_token';

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 1 week
export const ADMIN_COOKIE_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;

const encoder = new TextEncoder();

function getSecret(): string {
    return process.env.JWT_SECRET || 'fallback_dev_secret_wfs';
}

function toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(getSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return toBase64Url(new Uint8Array(sig));
}

// Constant-time string comparison (Edge has no crypto.timingSafeEqual).
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

// Mint a signed admin session token valid for one week.
export async function createAdminToken(now: number = Date.now()): Promise<string> {
    const expiry = now + MAX_AGE_MS;
    const message = `admin.${expiry}`;
    const sig = await hmacSign(message);
    return `${message}.${sig}`;
}

// Verify a token: correct shape, role, unexpired, and a valid signature.
export async function verifyAdminToken(token: string | undefined | null, now: number = Date.now()): Promise<boolean> {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [role, expiryStr, sig] = parts;
    if (role !== 'admin') return false;
    const expiry = parseInt(expiryStr, 10);
    if (!Number.isFinite(expiry) || now > expiry) return false;
    const expected = await hmacSign(`${role}.${expiryStr}`);
    return timingSafeEqual(sig, expected);
}
