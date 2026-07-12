import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isLocale, isRtl } from "../lib/locale";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dasres | Experts, Companies and Opportunities",
    template: "%s | Dasres",
  },
  description:
    "Dasres is a professional platform for discovering experts, companies, and international opportunities.",
  keywords: [
    "Dasres",
    "experts",
    "companies",
    "opportunities",
    "business platform",
    "international network",
  ],
  authors: [{ name: "Dasres" }],
  creator: "Dasres",
  publisher: "Dasres",
  openGraph: {
    title: "Dasres",
    description:
      "Discover experts, companies, and international opportunities.",
    url: siteUrl,
    siteName: "Dasres",
    type: "website",
    locale: "fa_IR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dasres",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dasres",
    description:
      "Discover experts, companies, and international opportunities.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestedLocale = await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : "fa";
  const messages = await getMessages();
  const direction = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}