import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Caveat } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthInitializer } from "@/components/providers/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KropiGo",
  description: "Grow Connect Trade",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "KropiGo",
    description: "Grow Connect Trade",
    type: "website",
    url: "https://kropigo.com",
    siteName: "KropiGo",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <AuthInitializer>
            <NextIntlClientProvider messages={messages}>
              <ThemeProvider>
                {children}
                <Toaster position="bottom-right" richColors />
              </ThemeProvider>
            </NextIntlClientProvider>
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
