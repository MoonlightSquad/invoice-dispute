import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
import { AuthModal } from "@/components/AuthModal";
import React from "react";
import { getDictionary } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Dispute Resolver"
};

export default async function RootLayout({
                                           children,
                                           params
                                         }: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>;
}>) {

  const { lang } = await params;
  const dict = await getDictionary(lang);
  return (
      <html
          lang={lang}
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
      <body className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">

          <div className="font-bold text-base sm:text-lg md:text-xl text-indigo-600 tracking-tight truncate min-w-0">
            Invoice Dispute Resolver
          </div>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">

            <nav className="hidden md:flex items-center gap-6">
              <a href={'/' + lang + '#features'} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">{dict.nav.features}</a>
              <a href={'/' + lang + '#pricing'} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">{dict.nav.pricing}</a>
            </nav>

            <div className="flex gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-[11px] sm:text-xs font-semibold">
              <a href="/en" className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>EN</a>
              <a href="/uk" className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition ${lang === 'uk' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>UK</a>
            </div>

            <AuthModal dict={dict}>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm whitespace-nowrap">
                {dict.nav.cta}
              </button>
            </AuthModal>

          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <div className="mb-3 flex gap-4 justify-center">
          <a href={`/${lang}/privacy`} className="hover:text-indigo-600 transition font-medium">
            {dict.privacy.title}
          </a>
          <a href={`/${lang}/tos`} className="hover:text-indigo-600 transition font-medium">
            {dict.tos.title}
          </a>
        </div>
        {dict.footer.rights}
      </footer>
      <Toaster richColors position="top-center" />
      </body>
      </html>
  );
}