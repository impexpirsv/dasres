import {
  getLocalizedStaticPublicPageAlternatePaths,
  getLocalizedStaticPublicPagePath,
  type LocalizedStaticPublicPage,
} from "./localized-static-pages-routing";
import { getAbsoluteUrl } from "./urls";

export { getLocalizedStaticPublicPagePath };

export function getLocalizedStaticPublicPageAlternates(
  page: LocalizedStaticPublicPage,
): Record<string, string> {
  const paths = getLocalizedStaticPublicPageAlternatePaths(page);

  for (const [language, pathname] of Object.entries(paths)) {
    paths[language] = getAbsoluteUrl(pathname);
  }

  return paths;
}
