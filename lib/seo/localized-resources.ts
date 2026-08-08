import {
  getLocalizedArticleAlternatePaths,
  getLocalizedResourcesAlternatePaths,
  getLocalizedResourcesPath,
} from "./localized-resources-routing";
import { getAbsoluteUrl } from "./urls";

export { getLocalizedResourcesPath };

function absoluteAlternates(paths: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(paths).map(([language, pathname]) => [language, getAbsoluteUrl(pathname)]),
  );
}

export function getLocalizedResourcesAlternates(category?: string): Record<string, string> {
  return absoluteAlternates(getLocalizedResourcesAlternatePaths(category));
}

export function getLocalizedArticleAlternates(
  category: string,
  slug: string,
  availableLocales: Parameters<typeof getLocalizedArticleAlternatePaths>[2],
): Record<string, string> {
  return absoluteAlternates(getLocalizedArticleAlternatePaths(category, slug, availableLocales));
}
