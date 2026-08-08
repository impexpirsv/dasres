import { getAbsoluteUrl } from "./urls";
import {
  getLocalizedExpertsAlternatePaths,
  getLocalizedExpertsPath,
} from "./localized-experts-routing";

export { getLocalizedExpertsPath };

export function getLocalizedExpertsAlternates({
  page,
  expertId,
}: {
  page?: number;
  expertId?: number;
} = {}): Record<string, string> {
  const paths = getLocalizedExpertsAlternatePaths({ page, expertId });

  for (const [language, pathname] of Object.entries(paths)) {
    paths[language] = getAbsoluteUrl(pathname);
  }

  return paths;
}
