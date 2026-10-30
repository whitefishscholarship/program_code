import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whitefish Scholarship Finder",
  description: "Find scholarships and open the real application sites. No account. We never keep your information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-body">
        <style>{`
          .topbar-inner,.stage,.glass-card,.panel,.award-card,.banner,.notice,.field,.chip,.question-row,.btn-secondary,.btn-tertiary,.app-footer,.stat,.hidden-box {
            -webkit-backdrop-filter: blur(20px) saturate(1.3);
            backdrop-filter: blur(20px) saturate(1.3);
          }
          .bare-fieldset {
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            background: transparent;
            box-shadow: none;
          }
          @supports not (backdrop-filter: blur(1px)) {
            .topbar-inner,.stage,.glass-card,.panel,.award-card,.banner,.notice,.field,.chip,.question-row,.btn-secondary,.btn-tertiary,.app-footer,.stat,.hidden-box {
              background-color: rgba(255,255,255,0.94);
              -webkit-backdrop-filter: none;
              backdrop-filter: none;
            }
          }
          @media (prefers-reduced-transparency: reduce) {
            .topbar-inner,.stage,.glass-card,.panel,.award-card,.banner,.notice,.field,.chip,.question-row,.btn-secondary,.btn-tertiary,.app-footer,.stat,.hidden-box {
              background-color: rgba(255,255,255,0.94);
              -webkit-backdrop-filter: none;
              backdrop-filter: none;
            }
          }
        `}</style>
        <div className="scene" aria-hidden="true">
          <div className="scene-photo" />
        </div>
        {children}
      </body>
    </html>
  );
}
