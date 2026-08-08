import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";

import { getLocalizedPublicPathLocale, locales } from "../lib/locale";
import { getPaginationMetadataState } from "../lib/seo/metadata";
import {
  getLocalizedOpportunitiesAlternatePaths,
  getLocalizedOpportunitiesPath,
} from "../lib/seo/localized-opportunities-routing";

assert.deepEqual(locales, [
  "fa", "en", "ar", "fr", "es", "zh", "ja", "de", "ru", "tr", "pt", "it",
]);

for (const locale of locales) {
  const directory = getLocalizedOpportunitiesPath(locale);
  const detail = getLocalizedOpportunitiesPath(locale, 15);
  assert.equal(directory, `/${locale}/opportunities`);
  assert.equal(detail, `/${locale}/opportunities/15`);
  assert.equal(getLocalizedPublicPathLocale(directory), locale);
  assert.equal(getLocalizedPublicPathLocale(detail), locale);

  const pageTwo = getLocalizedOpportunitiesAlternatePaths({ page: 2 });
  assert.equal(pageTwo[locale], `/${locale}/opportunities?page=2`);
  assert.equal(pageTwo["x-default"], pageTwo.fa);
  assert.equal(Object.keys(pageTwo).length, locales.length + 1);

  const details = getLocalizedOpportunitiesAlternatePaths({ opportunityId: 15 });
  assert.equal(details[locale], `/${locale}/opportunities/15`);
  assert.equal(details["x-default"], details.fa);
}

assert.equal(getLocalizedPublicPathLocale("/nl/opportunities"), null);
assert.equal(getLocalizedPublicPathLocale("/en/help"), "en");

assert.deepEqual(
  getPaginationMetadataState({
    pathname: "/en/opportunities",
    rawPage: "1",
    totalPages: 3,
  }),
  { isValid: true, canonical: "/en/opportunities", page: 1 },
);
assert.deepEqual(
  getPaginationMetadataState({
    pathname: "/en/opportunities",
    rawPage: "2",
    totalPages: 3,
  }),
  { isValid: true, canonical: "/en/opportunities?page=2", page: 2 },
);
for (const rawPage of ["0", "4", "invalid", "01"]) {
  assert.deepEqual(
    getPaginationMetadataState({
      pathname: "/en/opportunities",
      rawPage,
      totalPages: 3,
    }),
    { isValid: false, page: null },
  );
}

type MessageTree = { [key: string]: string | MessageTree };

function collectArguments(
  elements: MessageFormatElement[],
  target = new Set<string>(),
): Set<string> {
  for (const element of elements) {
    if (
      element.type !== TYPE.literal &&
      element.type !== TYPE.pound &&
      element.type !== TYPE.tag
    ) {
      target.add(element.value);
    }
    if (element.type === TYPE.select || element.type === TYPE.plural) {
      for (const option of Object.values(element.options)) {
        collectArguments(option.value, target);
      }
    }
    if (element.type === TYPE.tag) collectArguments(element.children, target);
  }
  return target;
}

function flatten(
  tree: MessageTree,
  prefix = "",
  output = new Map<string, string>(),
): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") output.set(path, value);
    else flatten(value, path, output);
  }
  return output;
}

const canonical = JSON.parse(
  readFileSync("messages/en.json", "utf8"),
) as MessageTree;
const canonicalNamespaces = Object.keys(canonical)
  .filter((key) => /opportunit/i.test(key))
  .sort();
const canonicalMessages = flatten(
  Object.fromEntries(canonicalNamespaces.map((key) => [key, canonical[key]])),
);

for (const locale of locales) {
  const messages = JSON.parse(
    readFileSync(`messages/${locale}.json`, "utf8"),
  ) as MessageTree;
  const localizedNamespaces = Object.keys(messages)
    .filter((key) => /opportunit/i.test(key))
    .sort();
  assert.deepEqual(localizedNamespaces, canonicalNamespaces);
  const localizedMessages = flatten(
    Object.fromEntries(canonicalNamespaces.map((key) => [key, messages[key]])),
  );
  assert.deepEqual(
    [...localizedMessages.keys()].sort(),
    [...canonicalMessages.keys()].sort(),
  );

  for (const [key, source] of canonicalMessages) {
    const localized = localizedMessages.get(key);
    assert.ok(localized !== undefined, `${locale}: missing ${key}`);
    assert.deepEqual(
      [...collectArguments(parse(localized))].sort(),
      [...collectArguments(parse(source))].sort(),
      `${locale}: ICU arguments differ for ${key}`,
    );
  }
}

console.log(
  "Localized Opportunities routing, pagination SEO, alternates, and FormatJS translation assertions passed.",
);
