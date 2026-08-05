import type { Locale } from "../locale";
import { locales } from "../locale";

export function getLocalizedCompaniesPath(
  locale: Locale,
  companyId?: number,
): string {
  return companyId === undefined
    ? `/${locale}/companies`
    : `/${locale}/companies/${companyId}`;
}

export function getLocalizedCompaniesAlternatePaths({
  page,
  companyId,
}: {
  page?: number;
  companyId?: number;
} = {}): Record<string, string> {
  const suffix = page && page > 1 ? `?page=${page}` : "";
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] =
      `${getLocalizedCompaniesPath(locale, companyId)}${suffix}`;
  }

  languages["x-default"] = languages.fa;
  return languages;
}
