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
  metadataBase: new URL("https://kropigo.in"),
  title: {
    default: "KropiGo — India's Direct Farm-to-Buyer Marketplace",
    template: "%s | KropiGo",
  },
  description:
    "KropiGo connects Indian farmers directly to buyers with 0% commission. Access live mandi rates, trade verified crops — grains, vegetables, fruits & spices — without middlemen.",
  keywords: [
    "agricultural marketplace India",
    "farmer to buyer platform",
    "sell crops online",
    "mandi rates live",
    "farm produce trading",
    "direct farm marketplace",
    "kisan trading platform",
    "agri commerce India",
    "buy crops online",
    "KropiGo",
  ],
  authors: [{ name: "KropiGo", url: "https://kropigo.in" }],
  creator: "KropiGo",
  publisher: "KropiGo",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "KropiGo — India's Direct Farm-to-Buyer Marketplace",
    description:
      "Connect directly with farmers or buyers. 0% commission, live mandi rates, verified network. Trade grains, vegetables, fruits & spices.",
    type: "website",
    url: "https://kropigo.in",
    siteName: "KropiGo",
    locale: "en_IN",
    images: [
      {
        url: "/KROPIGO_cropped.png",
        width: 512,
        height: 512,
        alt: "KropiGo — India's Agricultural Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "KropiGo — India's Farm-to-Buyer Marketplace",
    description:
      "0% commission. Live mandi rates. Direct farm trade — grains, vegetables, fruits & spices.",
    images: ["/KROPIGO_cropped.png"],
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
