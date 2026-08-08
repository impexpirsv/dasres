import type { Locale } from "../locale";
import { locales } from "../locale";

export const localizedStaticPublicPages = [
  "about",
  "contact",
  "pricing",
  "faq",
  "privacy",
  "terms",
  "cookies",
] as const;

export const indexableLocalizedStaticPublicPages = [
  "about",
  "contact",
  "pricing",
  "faq",
] as const;

export const noindexLocalizedStaticPublicPages = [
  "privacy",
  "terms",
  "cookies",
] as const;

export type LocalizedStaticPublicPage =
  (typeof localizedStaticPublicPages)[number];

export function getLocalizedStaticPublicPagePath(
  locale: Locale,
  page: LocalizedStaticPublicPage,
): string {
  return `/${locale}/${page}`;
}

export function getLocalizedStaticPublicPageAlternatePaths(
  page: LocalizedStaticPublicPage,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = getLocalizedStaticPublicPagePath(locale, page);
  }

  languages["x-default"] = languages.fa;
  return languages;
}
