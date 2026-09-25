import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUGGET — Personalized Daily Learning",
  description: "Bite-sized, multi-source verified learning from real news and curiosities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900 font-sans">
        {children}
      </body>
    </html>
  );
}
