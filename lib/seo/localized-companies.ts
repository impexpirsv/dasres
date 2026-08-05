import { getAbsoluteUrl } from "./urls";
import {
  getLocalizedCompaniesAlternatePaths,
  getLocalizedCompaniesPath,
} from "./localized-companies-routing";

export { getLocalizedCompaniesPath };

export function getLocalizedCompaniesAlternates({
  page,
  companyId,
}: {
  page?: number;
  companyId?: number;
} = {}): Record<string, string> {
  const alternatePaths = getLocalizedCompaniesAlternatePaths({
    page,
    companyId,
  });

  for (const [language, pathname] of Object.entries(alternatePaths)) {
    alternatePaths[language] = getAbsoluteUrl(pathname);
  }

  return alternatePaths;
}
