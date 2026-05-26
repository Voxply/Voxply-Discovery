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
        <header className="border-b border-neutral-800 px-6 py-3 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">
            Voxply
          </a>
          <nav className="flex items-center gap-4 text-sm text-neutral-400">
            <a href="/" className="hover:text-neutral-100 transition-colors">Hubs</a>
            <a href="/bots" className="hover:text-neutral-100 transition-colors">Bots</a>
            <a href="/clients" className="hover:text-neutral-100 transition-colors">Clients</a>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <a href="/submit" className="text-neutral-400 hover:text-neutral-100 transition-colors">
              List your hub →
            </a>
            <a
              href="/bots/submit"
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              List your bot →
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 px-6 py-4 text-xs text-neutral-500 text-center">
          Voxply — decentralized voice &amp; community
        </footer>
      </body>
    </html>
  );
}
