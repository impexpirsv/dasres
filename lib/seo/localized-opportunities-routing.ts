import type { Locale } from "../locale";
import { locales } from "../locale";

export function getLocalizedOpportunitiesPath(
  locale: Locale,
  opportunityId?: number,
): string {
  return opportunityId === undefined
    ? `/${locale}/opportunities`
    : `/${locale}/opportunities/${opportunityId}`;
}

export function getLocalizedOpportunitiesAlternatePaths({
  page,
  opportunityId,
}: {
  page?: number;
  opportunityId?: number;
} = {}): Record<string, string> {
  const suffix = page && page > 1 ? `?page=${page}` : "";
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] =
      `${getLocalizedOpportunitiesPath(locale, opportunityId)}${suffix}`;
  }

  languages["x-default"] = languages.fa;
  return languages;
}
