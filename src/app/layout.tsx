import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocDocs — collaborative document editor",
  description: "A lightweight Google-Docs-style collaborative document editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50">{children}</body>
    </html>
  );
}
