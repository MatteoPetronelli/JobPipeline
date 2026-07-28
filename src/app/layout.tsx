import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobPipeline Dashboard",
  description: "B3 Fullstack Apprenticeship Outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
