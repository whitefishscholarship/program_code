import ScholarshipBrowser from '@/components/ScholarshipBrowser';

export default function Home() {
  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">
        Skip to scholarship interview
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="topbar-title">Whitefish Scholarship Finder</h1>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="stage">
        <img className="diorama" src="/scene/diorama.webp" alt="" width={492} height={401} />
        <ScholarshipBrowser />
      </main>
      <footer className="app-footer">
        <a href="/admin" className="footer-link">Administrator sign-in</a>
      </footer>
    </div>
  );
}
