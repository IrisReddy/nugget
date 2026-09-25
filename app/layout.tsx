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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('nugget-theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-800 dark:selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
