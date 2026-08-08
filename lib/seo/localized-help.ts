import {
  getLocalizedHelpAlternatePaths,
  getLocalizedHelpPath,
} from "./localized-help-routing";
import { getAbsoluteUrl } from "./urls";

export { getLocalizedHelpPath };

export function getLocalizedHelpAlternates(
  category?: string,
): Record<string, string> {
  const paths = getLocalizedHelpAlternatePaths(category);

  for (const [language, pathname] of Object.entries(paths)) {
    paths[language] = getAbsoluteUrl(pathname);
  }

  return paths;
}
