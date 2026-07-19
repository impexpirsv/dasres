import type { Metadata } from "next";
import "./globals.css";

import {
  Geist,
  Geist_Mono,
  Vazirmatn,
} from "next/font/google";

import { NextIntlClientProvider } from "next-intl";

import {
  getLocale,
  getMessages,
  getTranslations,
} from "next-intl/server";

import {
  isLocale,
  isRtl,
} from "../lib/locale";


const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});


const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
  display: "swap",
});


const openGraphLocaleMap: Record<string, string> = {
  fa: "fa_IR",
  en: "en_US",
  ar: "ar_SA",
  fr: "fr_FR",
  es: "es_ES",
  zh: "zh_CN",
  ja: "ja_JP",
  de: "de_DE",
  ru: "ru_RU",
  tr: "tr_TR",
  pt: "pt_PT",
  it: "it_IT",
};


export async function generateMetadata(): Promise<Metadata> {
  const requestedLocale = await getLocale();

  const locale = isLocale(requestedLocale)
    ? requestedLocale
    : "fa";


  const t = await getTranslations({
    locale,
    namespace: "rootMetadata",
  });


  const openGraphLocale =
    openGraphLocaleMap[locale] ||
    "fa_IR";


  return {
    metadataBase: new URL(siteUrl),

    title: {
      default: t("title"),
      template: `%s | ${t("siteName")}`,
    },

    description: t("description"),

    applicationName: t("siteName"),

    keywords: [
      t("keywords.dasres"),
      t("keywords.experts"),
      t("keywords.companies"),
      t("keywords.opportunities"),
      t("keywords.trade"),
      t("keywords.business"),
      t("keywords.international"),
    ],

    authors: [
      {
        name: t("siteName"),
      },
    ],

    creator: t("siteName"),
    publisher: t("siteName"),

    alternates: {
      canonical: "/",
    },

    openGraph: {
      title: t("openGraph.title"),
      description: t("openGraph.description"),
      url: "/",
      siteName: t("siteName"),
      type: "website",
      locale: openGraphLocale,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t("openGraph.imageAlt"),
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
      images: ["/og-image.png"],
    },

    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const requestedLocale = await getLocale();


  const locale = isLocale(requestedLocale)
    ? requestedLocale
    : "fa";


  const messages = await getMessages();


  const direction = isRtl(locale)
    ? "rtl"
    : "ltr";


  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={`
        ${vazir.variable}
        ${geistSans.variable}
        ${geistMono.variable}
        h-full
        antialiased
      `}
    >

      <body className="flex min-h-full flex-col">

        <NextIntlClientProvider
          locale={locale}
          messages={messages}
        >
          {children}
        </NextIntlClientProvider>

      </body>

    </html>
  );
}