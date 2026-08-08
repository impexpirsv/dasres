import assert from "node:assert/strict";

import {
  getLocalizedHomepageLocale,
  locales,
} from "../lib/locale";
import { serializeJsonLd } from "../lib/seo/jsonld";
import {
  createLocalizedHomepageJsonLd,
  getAlternateOpenGraphLocales,
  getHomepageLanguageAlternates,
  getLocalizedHomepagePath,
  openGraphLocaleMap,
} from "../lib/seo/localized-homepage";

const languages = getHomepageLanguageAlternates();
assert.deepEqual(
  Object.keys(languages).sort(),
  [...locales, "x-default"].sort(),
);
assert.equal(languages["x-default"], languages.fa);

for (const locale of locales) {
  const pathname = getLocalizedHomepagePath(locale);
  const canonicalUrl = languages[locale];

  assert.equal(pathname, `/${locale}`);
  assert.equal(getLocalizedHomepageLocale(pathname), locale);
  assert.equal(getLocalizedHomepageLocale(`${pathname}/`), locale);
  assert.ok(canonicalUrl.endsWith(pathname));
  assert.equal(openGraphLocaleMap[locale].startsWith(`${locale}_`), true);
  assert.equal(getAlternateOpenGraphLocales(locale).length, locales.length - 1);
  assert.equal(
    getAlternateOpenGraphLocales(locale).includes(openGraphLocaleMap[locale]),
    false,
  );

  const jsonLd = createLocalizedHomepageJsonLd({
    locale,
    siteName: "Dasres",
    description: `Description for ${locale}`,
  });
  const serialized = serializeJsonLd(jsonLd);
  const parsed = JSON.parse(serialized) as {
    "@graph": Array<{
      "@type": string;
      "@id": string;
      url: string;
      inLanguage?: string;
    }>;
  };

  assert.deepEqual(
    parsed["@graph"].map((entry) => entry["@type"]),
    ["Organization", "WebSite", "WebPage"],
  );

  for (const entry of parsed["@graph"]) {
    assert.equal(entry.url, canonicalUrl);
    assert.ok(entry["@id"].startsWith(`${canonicalUrl}#`));
    if (entry["@type"] !== "Organization") {
      assert.equal(entry.inLanguage, locale);
    }
  }
}

console.log("Localized homepage metadata and JSON-LD assertions passed.");
