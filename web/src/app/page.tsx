import ScholarshipBrowser from '@/components/ScholarshipBrowser';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f7f3] text-slate-950">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-4 focus:ring-teal-300">
        Skip to scholarship interview
      </a>
      <header className="border-b border-slate-200 bg-[#123c3a] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 className="text-lg font-bold">Whitefish Scholarship Finder</h1>
          <p className="text-right text-sm text-teal-100">No account. Nothing saved about you.</p>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 lg:py-8">
        <ScholarshipBrowser />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between">
          <a href="/admin" className="font-semibold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200">Administrator sign-in</a>
        </div>
      </footer>
    </div>
  );
}
