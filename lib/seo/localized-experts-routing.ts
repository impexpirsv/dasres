import type { Locale } from "../locale";
import { locales } from "../locale";

export function getLocalizedExpertsPath(
  locale: Locale,
  expertId?: number,
): string {
  return expertId === undefined
    ? `/${locale}/experts`
    : `/${locale}/experts/${expertId}`;
}

export function getLocalizedExpertsAlternatePaths({
  page,
  expertId,
}: {
  page?: number;
  expertId?: number;
} = {}): Record<string, string> {
  const suffix = page && page > 1 ? `?page=${page}` : "";
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = `${getLocalizedExpertsPath(locale, expertId)}${suffix}`;
  }

  languages["x-default"] = languages.fa;
  return languages;
}
