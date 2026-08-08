import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import { contentRecords } from "../data/content/records";
import { knowledgeCategories, contentTypeCategories } from "../lib/content/catalog";
import { FileSystemContentRepository } from "../lib/content/repository";
import { collectContentValidationIssues } from "../lib/content/validation";
import { getLocalizedPublicPathLocale, locales } from "../lib/locale";
import {
  getLocalizedArticleAlternatePaths,
  getLocalizedResourcesAlternatePaths,
  getLocalizedResourcesPath,
} from "../lib/seo/localized-resources-routing";

async function verifyRepository() {
  const repository = new FileSystemContentRepository(contentRecords);
  const published = await repository.getAll({ status: "published" });
  assert.equal(published.length, 17);
  assert.deepEqual([...new Set(published.map((record) => record.locale))], ["en"]);

  for (const category of knowledgeCategories) {
    const landingAlternates = getLocalizedResourcesAlternatePaths(category);
    assert.equal(Object.keys(landingAlternates).length, locales.length + 1);
    assert.equal(landingAlternates["x-default"], landingAlternates.fa);
    for (const locale of locales) {
      const path = getLocalizedResourcesPath(locale, category);
      assert.equal(landingAlternates[locale], path);
      assert.equal(getLocalizedPublicPathLocale(path), locale);
      const records = await repository.getByCategory(
        Object.entries(contentTypeCategories).find(([, value]) => value === category)?.[0] as keyof typeof contentTypeCategories,
        { locale, status: "published" },
      );
      if (locale !== "en") assert.equal(records.length, 0);
    }
  }

  const directoryAlternates = getLocalizedResourcesAlternatePaths();
  assert.equal(directoryAlternates["x-default"], "/fa/resources");
  assert.equal(getLocalizedPublicPathLocale("/nl/resources"), null);

  for (const record of published) {
    const category = contentTypeCategories[record.category];
    const resolved = await repository.getByPath(record.category, record.slug, { locale: record.locale, status: "published" });
    assert.equal(resolved?.id, record.id);
    for (const locale of locales.filter((candidate) => candidate !== "en")) {
      assert.equal(await repository.getByPath(record.category, record.slug, { locale, status: "published" }), null);
    }
    const alternates = getLocalizedArticleAlternatePaths(category, record.slug, [record.locale]);
    assert.deepEqual(Object.keys(alternates).sort(), ["en", "x-default"]);
    assert.equal(alternates.en, `/en/resources/${category}/${record.slug}`);
    assert.equal(alternates["x-default"], alternates.en);
  }

  const sample = published[0];
  const related = await repository.getRelated(sample.id, { locale: "en", status: "published", limit: 4 });
  assert.ok(related.every((record) => record.locale === "en" && record.status === "published"));
  assert.deepEqual(await repository.getRelated(sample.id, { locale: "de", status: "published", limit: 4 }), []);

  const duplicate = { ...sample, id: `${sample.id}-duplicate` };
  const duplicateIssues = collectContentValidationIssues([...contentRecords, duplicate]);
  assert.ok(duplicateIssues.some((issue) => issue.code === "DUPLICATE_PATH"));
}

type MessageTree = { [key: string]: string | MessageTree };
function flatten(tree: MessageTree, prefix = "", output = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") output.set(path, value);
    else flatten(value, path, output);
  }
  return output;
}

function collectArguments(elements: MessageFormatElement[], target = new Set<string>()): Set<string> {
  for (const element of elements) {
    if (element.type !== TYPE.literal && element.type !== TYPE.pound && element.type !== TYPE.tag) target.add(element.value);
    if (element.type === TYPE.select || element.type === TYPE.plural) {
      for (const option of Object.values(element.options)) collectArguments(option.value, target);
    }
    if (element.type === TYPE.tag) collectArguments(element.children, target);
  }
  return target;
}

function verifyTranslations() {
  const namespaces = ["knowledgeHub", "projectPrintButton", "casesPage", "topRatedShowcase", "publicSite"] as const;
  const canonical = JSON.parse(readFileSync("messages/en.json", "utf8")) as MessageTree;
  const canonicalMessages = flatten(Object.fromEntries(namespaces.map((key) => [key, canonical[key]])));
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as MessageTree;
    const localized = flatten(Object.fromEntries(namespaces.map((key) => [key, messages[key]])));
    assert.deepEqual([...localized.keys()].sort(), [...canonicalMessages.keys()].sort(), `${locale}: structural key mismatch`);
    for (const [key, source] of canonicalMessages) {
      const target = localized.get(key);
      assert.ok(target !== undefined, `${locale}: missing ${key}`);
      assert.deepEqual([...collectArguments(parse(target))].sort(), [...collectArguments(parse(source))].sort(), `${locale}: ICU mismatch in ${key}`);
    }
  }
}

function verifyPureHelpers() {
  const source = readFileSync("lib/seo/localized-resources-routing.ts", "utf8");
  assert.doesNotMatch(source, /prisma|DATABASE_URL|\.\/urls|\.\.\/env/);
}

async function main() {
  await verifyRepository();
  verifyTranslations();
  verifyPureHelpers();
  console.log("Localized Resources routing, real-content alternates, repository isolation, uniqueness, and FormatJS assertions passed.");
}

void main();
