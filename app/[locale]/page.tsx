import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { env } from "../../lib/env";
import { isLocale } from "../../lib/locale";
import {
  getAlternateOpenGraphLocales,
  getHomepageLanguageAlternates,
  getLocalizedHomepagePath,
  openGraphLocaleMap,
} from "../../lib/seo/localized-homepage";
import { getAbsoluteUrl } from "../../lib/seo/urls";
import Homepage from "../components/homepage/Homepage";

type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "rootMetadata" });
  const canonicalPath = getLocalizedHomepagePath(locale);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalPath,
      languages: getHomepageLanguageAlternates(),
    },
    openGraph: {
      title: t("openGraph.title"),
      description: t("openGraph.description"),
      url: canonicalUrl,
      siteName: t("siteName"),
      type: "website",
      locale: openGraphLocaleMap[locale],
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t("openGraph.imageAlt"),
        },
      ],
    },
  };
}

export default async function LocalizedHomepage({ params }: Props) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <Homepage locale={locale} localized />;
}
