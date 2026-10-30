import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <main className="admin-frame">
      <section className="glass-card admin-card mx-auto max-w-2xl">
        <p className="meta-label">Read-only production</p>
        <h1 className="page-title mt-3">Scholarship administration has moved offline.</h1>
        <p className="lede">
          This deployed application uses only the reviewed, immutable scholarship publication. Production ingestion and spreadsheet writes are disabled.
        </p>
        <p className="lede">
          Future data changes require their own reviewed publication workflow before deployment.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          Return to scholarships
        </Link>
      </section>
    </main>
  );
}
