import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";

import { getLocalizedPublicPathLocale, locales } from "../lib/locale";
import {
  getLocalizedStaticPublicPageAlternatePaths,
  getLocalizedStaticPublicPagePath,
  indexableLocalizedStaticPublicPages,
  localizedStaticPublicPages,
  noindexLocalizedStaticPublicPages,
} from "../lib/seo/localized-static-pages-routing";

assert.equal(localizedStaticPublicPages.length, 7);
assert.deepEqual(indexableLocalizedStaticPublicPages, [
  "about", "contact", "pricing", "faq",
]);
assert.deepEqual(noindexLocalizedStaticPublicPages, [
  "privacy", "terms", "cookies",
]);

for (const page of localizedStaticPublicPages) {
  const alternates = getLocalizedStaticPublicPageAlternatePaths(page);
  assert.equal(Object.keys(alternates).length, locales.length + 1);
  assert.equal(alternates["x-default"], alternates.fa);

  for (const locale of locales) {
    const path = getLocalizedStaticPublicPagePath(locale, page);
    assert.equal(path, `/${locale}/${page}`);
    assert.equal(alternates[locale], path);
    assert.equal(getLocalizedPublicPathLocale(path), locale);
  }
}

assert.equal(getLocalizedPublicPathLocale("/nl/about"), null);
assert.equal(getLocalizedPublicPathLocale("/en/help"), "en");
assert.equal(getLocalizedPublicPathLocale("/en/resources"), "en");

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
const namespaces = ["publicSite", "knowledgeHub"] as const;
const canonicalMessages = flatten(
  Object.fromEntries(namespaces.map((key) => [key, canonical[key]])),
);

for (const locale of locales) {
  const messages = JSON.parse(
    readFileSync(`messages/${locale}.json`, "utf8"),
  ) as MessageTree;
  const localizedMessages = flatten(
    Object.fromEntries(namespaces.map((key) => [key, messages[key]])),
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
  "Localized static routes, alternates, legal/indexable policy, and FormatJS translation assertions passed.",
);
