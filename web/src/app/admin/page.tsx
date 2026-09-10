import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Read-only production</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Scholarship administration has moved offline.</h1>
        <p className="mt-5 leading-7 text-slate-700">
          This deployed application uses only the reviewed, immutable scholarship publication. Production ingestion and spreadsheet writes are disabled.
        </p>
        <p className="mt-3 leading-7 text-slate-700">
          Future data changes require their own reviewed publication workflow before deployment.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">
          Return to scholarships
        </Link>
      </section>
    </main>
  );
}
