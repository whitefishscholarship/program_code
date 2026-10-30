'use client';

import { useState } from 'react';
import { initiatePasswordRecovery, validateRecoveryPin } from '../actions';

export default function RecoverPasswordPage() {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleRequestPin = async () => {
        setIsLoading(true);
        setError(null);

        const res = await initiatePasswordRecovery();
        if (res.error) {
            setError(res.error);
        } else {
            setStep('verify');
            setSuccessMsg('A one-time recovery code has been sent to the Master Admin email address. It will expire in 15 minutes.');
        }
        setIsLoading(false);
    };

    const handleVerifyPin = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);

        const res = await validateRecoveryPin(formData);
        if (res.error) {
            setError(res.error);
            setIsLoading(false);
        } else if (res.redirectUrl) {
            // Hard window navigation to clear cache and force middleware re-evaluation
            window.location.href = res.redirectUrl;
        }
    };

    return (
        <div className="admin-frame">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                </div>
                <h2 className="page-title mt-2 text-center">
                    Recover Dashboard Access
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 'request'
                        ? 'Request a temporary code to bypass the master password.'
                        : 'Enter the recovery code sent to the administrator email.'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="glass-card admin-card">

                    {successMsg && (
                        <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                            <h3 className="text-sm font-medium text-green-800">{successMsg}</h3>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                    )}

                    {step === 'request' ? (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                For security purposes, recovery codes can only be sent to the pre-authorized administrator email address tied to this Vercel deployment.
                            </p>
                            <button
                                onClick={handleRequestPin}
                                disabled={isLoading}
                                className="btn btn-primary w-full"
                            >
                                {isLoading ? 'Generating secure PIN...' : 'Email Admin Recovery PIN'}
                            </button>
                        </div>
                    ) : (
                        <form action={handleVerifyPin} className="space-y-6">
                            <div>
                                <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                                    Recovery Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="text"
                                        autoComplete="one-time-code"
                                        maxLength={32}
                                        required
                                        className="field text-center tracking-widest"
                                        placeholder="paste code from email"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full"
                            >
                                {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-6 flex justify-center text-sm space-x-4">
                    <a href="/admin/login" className="text-gray-500 hover:text-gray-900 transition-colors">
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
