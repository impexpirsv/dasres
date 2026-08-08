import { getAbsoluteUrl } from "./urls";
import {
  getLocalizedOpportunitiesAlternatePaths,
  getLocalizedOpportunitiesPath,
} from "./localized-opportunities-routing";

export { getLocalizedOpportunitiesPath };

export function getLocalizedOpportunitiesAlternates({
  page,
  opportunityId,
}: {
  page?: number;
  opportunityId?: number;
} = {}): Record<string, string> {
  const paths = getLocalizedOpportunitiesAlternatePaths({
    page,
    opportunityId,
  });

  for (const [language, pathname] of Object.entries(paths)) {
    paths[language] = getAbsoluteUrl(pathname);
  }

  return paths;
}
