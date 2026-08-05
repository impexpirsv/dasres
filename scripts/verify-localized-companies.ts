import assert from "node:assert/strict";

import { getLocalizedPublicPathLocale, locales } from "../lib/locale";
import {
  getLocalizedCompaniesAlternatePaths,
  getLocalizedCompaniesPath,
} from "../lib/seo/localized-companies-routing";

for (const locale of locales) {
  const directoryPath = getLocalizedCompaniesPath(locale);
  const detailPath = getLocalizedCompaniesPath(locale, 123);

  assert.equal(directoryPath, `/${locale}/companies`);
  assert.equal(detailPath, `/${locale}/companies/123`);
  assert.equal(getLocalizedPublicPathLocale(directoryPath), locale);
  assert.equal(getLocalizedPublicPathLocale(detailPath), locale);

  const directoryAlternates = getLocalizedCompaniesAlternatePaths({ page: 3 });
  assert.equal(Object.keys(directoryAlternates).length, locales.length + 1);
  assert.ok(directoryAlternates[locale].endsWith(`/${locale}/companies?page=3`));
  assert.equal(directoryAlternates["x-default"], directoryAlternates.fa);

  const detailAlternates = getLocalizedCompaniesAlternatePaths({ companyId: 123 });
  assert.ok(detailAlternates[locale].endsWith(`/${locale}/companies/123`));
  assert.equal(detailAlternates["x-default"], detailAlternates.fa);
}

assert.equal(getLocalizedPublicPathLocale("/nl/companies"), null);
assert.equal(getLocalizedPublicPathLocale("/en/experts"), null);

console.log("Localized Companies routing and metadata assertions passed.");
