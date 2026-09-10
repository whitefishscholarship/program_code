import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whitefish High School Scholarships",
  description: "Explore Whitefish scholarship award records, application methods, and clearly labeled cycle availability.",
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
