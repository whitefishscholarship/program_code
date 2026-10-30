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
      <body className="antialiased">{children}</body>
    </html>
  );
}
