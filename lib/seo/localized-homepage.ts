import type { Locale } from "../locale";
import { locales } from "../locale";
import { getAbsoluteUrl } from "./urls";

export const openGraphLocaleMap: Record<Locale, string> = {
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

export function getLocalizedHomepagePath(locale: Locale): `/${Locale}` {
  return `/${locale}`;
}

export function getHomepageLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": getAbsoluteUrl("/"),
  };

  for (const locale of locales) {
    languages[locale] = getAbsoluteUrl(getLocalizedHomepagePath(locale));
  }

  return languages;
}

export function getAlternateOpenGraphLocales(locale: Locale): string[] {
  return locales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => openGraphLocaleMap[candidate]);
}

export function createLocalizedHomepageJsonLd({
  locale,
  siteName,
  description,
}: {
  locale: Locale;
  siteName: string;
  description: string;
}) {
  const url = getAbsoluteUrl(getLocalizedHomepagePath(locale));
  const organizationId = `${url}#organization`;
  const websiteId = `${url}#website`;
  const webpageId = `${url}#webpage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        url,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url,
        name: siteName,
        description,
        inLanguage: locale,
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url,
        name: siteName,
        description,
        inLanguage: locale,
        isPartOf: {
          "@id": websiteId,
        },
        about: {
          "@id": organizationId,
        },
      },
    ],
  };
}
