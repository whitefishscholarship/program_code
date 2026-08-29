import ScholarshipBrowser from '@/components/ScholarshipBrowser';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f7f3] text-slate-950">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-4 focus:ring-teal-300">
        Skip to scholarship explorer
      </a>
      <header className="border-b border-slate-200 bg-[#123c3a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-teal-200">Whitefish Scholarship Fund</p>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Scholarship opportunities, clearly explained.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              Explore verified award records, understand how shared applications work, and see when cycle availability still needs confirmation.
            </p>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-12">
        <ScholarshipBrowser />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Always confirm requirements and availability on the official source before applying.</p>
          <a href="/admin" className="font-semibold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200">Administrator sign-in</a>
        </div>
      </footer>
    </div>
  );
}
