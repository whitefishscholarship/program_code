'use client';

import { useState } from 'react';

type IngestionMode = 'url' | 'document' | 'text';

export default function AdminDashboard() {
    const [mode, setMode] = useState<IngestionMode>('url');
    const [inputUrl, setInputUrl] = useState('');
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Staging Data
    const [stagedData, setStagedData] = useState<any | null>(null);
    const [isPushing, setIsPushing] = useState(false);
    const [pushSuccess, setPushSuccess] = useState(false);

    const handleExtract = async () => {
        setIsExtracting(true);
        setError(null);
        setStagedData(null);
        setPushSuccess(false);

        try {
            const formData = new FormData();
            formData.append('mode', mode);

            if (mode === 'url' && inputUrl) {
                formData.append('url', inputUrl);
            } else if (mode === 'document' && file) {
                formData.append('file', file);
            } else if (mode === 'text' && inputText) {
                formData.append('text', inputText);
            } else {
                throw new Error("Missing required exact input for the selected mode.");
            }

            const res = await fetch('/api/admin/extract', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to extract scholarship data.');
            }
            if (!data.success || !data.data || data.data.length === 0) {
                throw new Error('AI returned an empty extraction. Try providing more text.');
            }

            setStagedData(data.data);

        } catch (err: any) {
            setError(err.message || 'Failed to extract scholarship data.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handlePushToDatabase = async () => {
        setIsPushing(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stagedData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to push row to Master Database.');
            }

            setPushSuccess(true);

        } catch (err: any) {
            setError(err.message || 'Failed to push scholarship data.');
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex justify-center items-center text-white font-bold text-sm">
                            WFS
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Console</h1>
                    </div>
                    <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        ← Exit to App
                    </a>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* INGESTION BLOCK */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900">Scholarship Ingestion Engine</h2>
                        <p className="text-sm text-gray-500 mt-1">Submit unstructured scholarship data for AI normalization.</p>
                    </div>

                    <div className="p-6">
                        {/* Tab Selector */}
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 max-w-md">
                            {(['url', 'document', 'text'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === m
                                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-900/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {m === 'url' ? '🔗 URL Link' : m === 'document' ? '📄 Upload PDF' : '📝 Raw Text'}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="min-h-[120px]">
                            {mode === 'url' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Website URL</label>
                                    <input
                                        type="url"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        placeholder="https://app.goingmerry.com/..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-black"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">The AI will attempt to scrape and parse the text directly from the single page provided.</p>
                                </div>
                            )}

                            {mode === 'document' && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg px-6 py-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                            {file ? file.name : 'Click to select a document'}
                                        </span>
                                        {!file && <span className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT up to 10MB</span>}
                                    </label>
                                </div>
                            )}

                            {mode === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Paste Raw Text Input</label>
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        rows={6}
                                        placeholder="Paste unformatted text from an email, flyer, or word document here..."
                                        className="w-full text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-black font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleExtract}
                                disabled={isExtracting || (mode === 'url' && !inputUrl) || (mode === 'text' && !inputText) || (mode === 'document' && !file)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all flex items-center
                                    ${isExtracting ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow disabled:bg-gray-300 disabled:cursor-not-allowed'}
                                `}
                            >
                                {isExtracting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Extracting Data...
                                    </>
                                ) : 'Extract & Analyze Data'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* STAGING AREA */}
                {stagedData && (
                    <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden ring-1 ring-blue-500/20 animate-in fade-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                                    AI Extraction Complete
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Review the normalized mapping below. Click any cell to manually correct the data.</p>
                            </div>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(stagedData[0]).map(key => (
                                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stagedData.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                            {Object.keys(row).map(key => (
                                                <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <input
                                                        type="text"
                                                        value={row[key]}
                                                        onChange={(e) => {
                                                            const newData = [...stagedData];
                                                            newData[i][key] = e.target.value;
                                                            setStagedData(newData);
                                                        }}
                                                        className="w-full bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            {pushSuccess ? (
                                <p className="text-sm font-medium text-green-700 bg-green-100 py-1.5 px-3 rounded flex items-center">
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Successfully Inserted into the Google Sheet!
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 font-medium bg-red-100 text-red-700 px-2 py-1 rounded inline-flex items-center">
                                    ⚠️ This row has been evaluated but has NOT been published to the Google Sheet yet.
                                </p>
                            )}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStagedData(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Discard / Start Over
                                </button>
                                <button
                                    onClick={handlePushToDatabase}
                                    disabled={isPushing || pushSuccess}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow transition-colors flex items-center ${pushSuccess ? 'bg-green-700 opacity-50 cursor-not-allowed' :
                                            isPushing ? 'bg-green-500 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {isPushing ? 'Pushing...' : pushSuccess ? 'Committed ✓' : 'Approve & Push to Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
