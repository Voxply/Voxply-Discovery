import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voxply Hub Directory",
  description: "Discover and share Voxply communities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 px-6 py-3 flex items-center gap-4">
          <a href="/" className="font-semibold text-lg tracking-tight">Voxply Directory</a>
          <span className="text-neutral-500 text-sm flex-1">Discover communities</span>
          <a href="/submit" className="text-sm text-indigo-400 hover:text-indigo-300">List your hub →</a>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 px-6 py-4 text-xs text-neutral-500 text-center">
          Voxply — decentralized voice &amp; community
        </footer>
      </body>
    </html>
  );
}
