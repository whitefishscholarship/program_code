'use client';

import { useState, useEffect } from 'react';
import InterviewWizard from '@/components/InterviewWizard';
import { AnswerMap } from '@/types/wizard';
import { processAndFilter } from '@/lib/processor';
import { downloadAsExcel } from '@/lib/export';

type AppState = 'START' | 'INTERVIEW' | 'PROCESSING' | 'EXPORT_SCREEN' | 'ERROR';

const SESSION_KEY = 'scholarship_export_payload_v1';
const EXPIRY_MINUTES = 15;

export default function Home() {
  const [appState, setAppState] = useState<AppState>('START');

  // Notice we only keep the answers during processing, they are not stored to disk
  const [, setAnswers] = useState<AnswerMap | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [excelDataUri, setExcelDataUri] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  // 15-minute retry window checking on load
  useEffect(() => {
    const checkSession = () => {
      try {
        const payloadStr = sessionStorage.getItem(SESSION_KEY);
        if (payloadStr) {
          const payload = JSON.parse(payloadStr);
          const nowUtc = new Date().getTime();

          if (nowUtc < payload.expires_at_utc) {
            setMatchedCount(payload.matched_rows.length);
            // Pre-bake the excel file for immediate Native HTML downloading
            setExcelDataUri(downloadAsExcel(payload.matched_rows));
            setAppState('EXPORT_SCREEN');
          } else {
            // Expired
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    };
    checkSession();
  }, []);

  const startInterview = () => {
    setAppState('INTERVIEW');
  };

  const processAnswers = async (submittedAnswers: AnswerMap) => {
    setAnswers(submittedAnswers);
    setAppState('PROCESSING');

    try {
      // 1. Fetch raw data from backend (which is read-only and cached)
      const res = await fetch('/api/scholarships');
      if (!res.ok) throw new Error('Network issue fetching data. Try again.');

      const resJson = await res.json();
      if (resJson.error) throw new Error(resJson.error);

      // 2. Filter and rank fully in the browser memory
      const matched = processAndFilter(resJson.data, submittedAnswers);
      setMatchedCount(matched.length);

      // 3. Store matched rows (NOT answers) in session storage for the 15-minute retry window
      const nowUtc = new Date().getTime();
      const payload = {
        schema_version: '1.0',
        created_at_utc: nowUtc,
        last_active_at_utc: nowUtc,
        expires_at_utc: nowUtc + (EXPIRY_MINUTES * 60 * 1000),
        matched_rows: matched
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));

      // Pre-bake the excel file for immediate Native HTML downloading
      setExcelDataUri(matched.length > 0 ? downloadAsExcel(matched) : '');

      // 4. Move to export screen and CLEAR answers from state
      setAnswers(null);
      setAppState('EXPORT_SCREEN');

    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setAppState('ERROR');
    }
  };

  const resetApp = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAnswers(null);
    setExcelDataUri('');
    setAppState('START');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)]">

      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Scholarship Match
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Answer a few questions to find scholarships you realistically qualify for.
          Your data is entirely private and disappears when you leave.
        </p>
      </div>

      {appState === 'START' && (
        <div className="flex justify-center mt-12 text-black">
          <button
            onClick={startInterview}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 transition-all text-lg"
          >
            Start Guided Interview
          </button>
        </div>
      )}

      {appState === 'INTERVIEW' && (
        <InterviewWizard onComplete={processAnswers} />
      )}

      {appState === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-medium text-gray-800">Finding your matches...</h2>
          <p className="text-gray-500 mt-2 text-sm">Running purely in your browser for privacy.</p>
        </div>
      )}

      {appState === 'EXPORT_SCREEN' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className={`w-16 h-16 ${matchedCount > 0 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {matchedCount > 0 ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {matchedCount > 0 ? "Matches Found!" : "No Matches Found"}
          </h2>
          <p className="text-gray-600 mb-8">
            We&apos;ve found <strong>{matchedCount}</strong> matching scholarships for you.
            {matchedCount > 0 ? (
              <span> Download your personalized spreadsheet below.</span>
            ) : (
              <span> Try broadening your criteria or Target School Types to find more opportunities.</span>
            )}
          </p>

          <div className="flex flex-col gap-4">
            {matchedCount > 0 && (
              <>
                <a
                  href={excelDataUri}
                  download={`Scholarship_Matches_${new Date().toISOString().split('T')[0]}.xlsx`}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm block"
                >
                  Download as Excel (.xlsx)
                </a>
                <p className="text-xs text-gray-400">
                  For your privacy, this list will only be available to download for 15 minutes.
                  Once you close this tab, all session data is permanently cleared.
                </p>
              </>
            )}
            <button
              onClick={resetApp}
              className="text-gray-500 text-sm hover:text-gray-800 underline mt-2"
            >
              Start Over (Clears Data)
            </button>
          </div>
        </div>
      )}

      {appState === 'ERROR' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center">
          <div className="text-red-500 mb-4 mx-auto w-12 h-12">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={resetApp}
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

    </main>
  );
}
