import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";

import { getLocalizedPublicPathLocale, locales } from "../lib/locale";
import {
  getLocalizedExpertsAlternatePaths,
  getLocalizedExpertsPath,
} from "../lib/seo/localized-experts-routing";

assert.deepEqual(locales, ["fa", "en", "ar", "fr", "es", "zh", "ja", "de", "ru", "tr", "pt", "it"]);

for (const locale of locales) {
  const directory = getLocalizedExpertsPath(locale);
  const detail = getLocalizedExpertsPath(locale, 15);
  assert.equal(directory, `/${locale}/experts`);
  assert.equal(detail, `/${locale}/experts/15`);
  assert.equal(getLocalizedPublicPathLocale(directory), locale);
  assert.equal(getLocalizedPublicPathLocale(detail), locale);

  const paginated = getLocalizedExpertsAlternatePaths({ page: 2 });
  assert.equal(paginated[locale], `/${locale}/experts?page=2`);
  assert.equal(paginated["x-default"], paginated.fa);

  const details = getLocalizedExpertsAlternatePaths({ expertId: 15 });
  assert.equal(details[locale], `/${locale}/experts/15`);
  assert.equal(details["x-default"], details.fa);
  assert.equal(Object.keys(details).length, locales.length + 1);
}

assert.equal(getLocalizedPublicPathLocale("/nl/experts"), null);
assert.equal(getLocalizedPublicPathLocale("/en/opportunities"), "en");

type MessageTree = { [key: string]: string | MessageTree };

function collectArguments(elements: MessageFormatElement[], target = new Set<string>()): Set<string> {
  for (const element of elements) {
    if (element.type !== TYPE.literal && element.type !== TYPE.pound && element.type !== TYPE.tag) {
      target.add(element.value);
    }
    if (element.type === TYPE.select || element.type === TYPE.plural) {
      for (const option of Object.values(element.options)) collectArguments(option.value, target);
    }
    if (element.type === TYPE.tag) collectArguments(element.children, target);
  }
  return target;
}

function flatten(tree: MessageTree, prefix = "", output = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") output.set(path, value);
    else flatten(value, path, output);
  }
  return output;
}

const canonical = JSON.parse(readFileSync("messages/en.json", "utf8")) as MessageTree;
const expertNamespaces = Object.keys(canonical).filter((key) => /expert/i.test(key));
const canonicalMessages = flatten(Object.fromEntries(expertNamespaces.map((key) => [key, canonical[key]])));

for (const locale of locales) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as MessageTree;
  const localizedMessages = flatten(Object.fromEntries(expertNamespaces.map((key) => [key, messages[key]])));
  assert.deepEqual([...localizedMessages.keys()].sort(), [...canonicalMessages.keys()].sort());

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

console.log("Localized Experts routing, alternates, and FormatJS translation assertions passed.");
