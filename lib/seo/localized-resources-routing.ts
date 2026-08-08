import type { Locale } from "../locale";
import { locales } from "../locale";

export function getLocalizedResourcesPath(
  locale: Locale,
  category?: string,
  slug?: string,
): string {
  const categoryPath = category === undefined ? "" : `/${category}`;
  const articlePath = slug === undefined ? "" : `/${slug}`;
  return `/${locale}/resources${categoryPath}${articlePath}`;
}

export function getLocalizedResourcesAlternatePaths(
  category?: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = getLocalizedResourcesPath(locale, category);
  }
  languages["x-default"] = languages.fa;
  return languages;
}

export function getLocalizedArticleAlternatePaths(
  category: string,
  slug: string,
  availableLocales: readonly Locale[],
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    if (availableLocales.includes(locale)) {
      languages[locale] = getLocalizedResourcesPath(locale, category, slug);
    }
  }

  const defaultArticleLocale = availableLocales.includes("fa")
    ? "fa"
    : availableLocales.includes("en")
      ? "en"
      : locales.find((locale) => availableLocales.includes(locale));

  if (defaultArticleLocale) {
    languages["x-default"] = getLocalizedResourcesPath(
      defaultArticleLocale,
      category,
      slug,
    );
  }
  return languages;
}
