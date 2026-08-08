import type { Locale } from "../locale";
import { locales } from "../locale";

export function getLocalizedHelpPath(
  locale: Locale,
  category?: string,
): string {
  return category === undefined
    ? `/${locale}/help`
    : `/${locale}/help/${category}`;
}

export function getLocalizedHelpAlternatePaths(
  category?: string,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = getLocalizedHelpPath(locale, category);
  }

  languages["x-default"] = languages.fa;
  return languages;
}
