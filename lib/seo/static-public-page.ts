import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "../locale";
import {
  getAlternateOpenGraphLocales,
  openGraphLocaleMap,
} from "./localized-homepage";
import { getLocalizedStaticPublicPageAlternates } from "./localized-static-pages";
import { createPublicPageMetadata } from "./metadata";

type StaticPublicPage =
  | "about"
  | "contact"
  | "pricing"
  | "help"
  | "faq"
  | "privacy"
  | "terms"
  | "cookies"
  | "resources";

export async function createStaticPublicPageMetadata(
  page: StaticPublicPage,
  canonical: `/${string}`,
  options?: { noindex?: boolean; locale?: Locale; localized?: boolean },
): Promise<Metadata> {
  const requestedLocale = options?.locale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const t = await getTranslations({
    locale,
    namespace: `publicSite.pages.${page}`,
  });

  const metadata = createPublicPageMetadata({
    title: t("metadata.title"),
    description: t("metadata.description"),
    canonical,
    robots: options?.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  });

  if (!options?.localized) return metadata;

  return {
    ...metadata,
    alternates: {
      canonical,
      languages: getLocalizedStaticPublicPageAlternates(
        page as Exclude<StaticPublicPage, "help" | "resources">,
      ),
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonical,
      locale: openGraphLocaleMap[locale],
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
  };
}

export async function getStaticPublicPageIdentity(
  page: StaticPublicPage,
  canonicalPath: `/${string}`,
  options?: { locale?: Locale; localized?: boolean },
) {
  const requestedLocale = options?.locale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [common, pageTranslations] = await Promise.all([
    getTranslations({ locale, namespace: "publicSite.common" }),
    getTranslations({ locale, namespace: `publicSite.pages.${page}` }),
  ]);

  return {
    canonicalPath,
    name: pageTranslations("title"),
    description: pageTranslations("metadata.description"),
    language: locale,
    breadcrumbs: [
      {
        name: common("home"),
        pathname: options?.localized ? `/${locale}` : "/",
      },
      { name: pageTranslations("title"), pathname: canonicalPath },
    ],
  };
}
