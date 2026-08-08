import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "@formatjs/icu-messageformat-parser";
import { NextRequest } from "next/server";

import { contentRepository } from "../lib/content/repository";
import { defaultLocale, locales } from "../lib/locale";
import { getLocalizedArticleAlternatePaths } from "../lib/seo/localized-resources-routing";
import {
  ENTITY_CLUSTERS_PER_SHARD,
  LOCALIZED_ENTITY_URLS_PER_CLUSTER,
  SITEMAP_PROTOCOL_URL_LIMIT,
  SITEMAP_TARGET_URL_LIMIT,
} from "../lib/seo/sitemap-shards";
import { getLegacyRedirectPath, getProxyBranch, proxy } from "../proxy";

const publicFamilies = [
  "", "companies", "experts", "opportunities", "about", "contact", "pricing",
  "faq", "privacy", "terms", "cookies", "help", "resources",
] as const;

async function main(): Promise<void> {
for (const locale of locales) {
  for (const family of publicFamilies) {
    assert.equal(getProxyBranch(`/${locale}${family ? `/${family}` : ""}`), "public-locale");
  }
}

for (const pathname of ["/", "/companies", "/companies/15", "/experts", "/experts/15", "/opportunities", "/opportunities/15", "/about", "/contact", "/pricing", "/faq", "/privacy", "/terms", "/cookies", "/help", "/help/getting-started", "/resources", "/resources/tutorials"]) {
  assert.equal(getProxyBranch(pathname), "legacy-public");
  const fallback = new NextRequest(`https://example.com${pathname}?source=a`);
  assert.equal(await getLegacyRedirectPath(fallback), `/fa${pathname === "/" ? "" : pathname}`);
  const cookie = new NextRequest(`https://example.com${pathname}?source=a`, { headers: { cookie: "NEXT_LOCALE=de" } });
  const response = await proxy(cookie);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), `https://example.com/de${pathname === "/" ? "" : pathname}?source=a`);
}

for (const pathname of ["/api/login", "/dashboard", "/dashboard/settings", "/login", "/register", "/robots.txt", "/sitemap.xml", "/sitemaps/static-0.xml", "/_next/static/a.js", "/unknown", "/nl/about", "/en/dashboard", "/en/login", "/en/api/login"]) {
  assert.notEqual(getProxyBranch(pathname), "legacy-public");
  const response = await proxy(new NextRequest(`https://example.com${pathname}`));
  assert.equal(response.headers.has("location"), false);
}
assert.equal((await proxy(new NextRequest("https://example.com/nl/about"))).status, 404);
assert.equal((await proxy(new NextRequest("https://example.com/unknown-production-audit"))).status, 404);

const records = await contentRepository.getAll({ status: "published" });
assert.ok(records.length > 0);
for (const record of records) {
  const request = new NextRequest(`https://example.com${record.canonical}`, { headers: { cookie: "NEXT_LOCALE=de" } });
  const redirectPath = await getLegacyRedirectPath(request);
  const translations = records.filter((candidate) => candidate.canonical === record.canonical);
  const available = translations.map((candidate) => candidate.locale);
  const expectedLocale = available.includes("de") ? "de" : available.includes(defaultLocale) ? defaultLocale : available.includes("en") ? "en" : available[0];
  assert.equal(redirectPath, `/${expectedLocale}${record.canonical}`);
  const segments = record.canonical.split("/");
  const alternates = getLocalizedArticleAlternatePaths(segments[2], record.slug, available);
  assert.equal(alternates["x-default"], `/${available.includes("fa") ? "fa" : available.includes("en") ? "en" : available[0]}${record.canonical}`);
  assert.deepEqual(Object.keys(alternates).filter((key) => key !== "x-default").sort(), [...new Set(available)].sort());
}
assert.equal(await getLegacyRedirectPath(new NextRequest("https://example.com/resources/tutorials/not-real")), null);
assert.equal((await proxy(new NextRequest("https://example.com/resources/tutorials/not-real"))).status, 404);
assert.equal((await proxy(new NextRequest("https://example.com/de/resources/tutorials/create-your-dasres-account"))).status, 404);

const homepageSeoSource = await readFile(path.join(process.cwd(), "lib/seo/localized-homepage.ts"), "utf8");
assert.ok(homepageSeoSource.includes('"x-default": getAbsoluteUrl(getLocalizedHomepagePath("fa"))'));
assert.equal(LOCALIZED_ENTITY_URLS_PER_CLUSTER, locales.length);
assert.equal(ENTITY_CLUSTERS_PER_SHARD, 3_333);
assert.ok(ENTITY_CLUSTERS_PER_SHARD * LOCALIZED_ENTITY_URLS_PER_CLUSTER <= SITEMAP_TARGET_URL_LIMIT);
assert.ok(SITEMAP_TARGET_URL_LIMIT < SITEMAP_PROTOCOL_URL_LIMIT);

const sitemapSource = await readFile(path.join(process.cwd(), "app/sitemaps/sitemap.ts"), "utf8");
for (const legacyExpression of ["getAbsoluteUrl(\"/\")", "getAbsoluteUrl(\"/companies\")", "getAbsoluteUrl(\"/experts\")", "getAbsoluteUrl(\"/opportunities\")", "getAbsoluteUrl(`/resources/${category}/${slug}`)"]) {
  assert.ok(!sitemapSource.includes(legacyExpression), `Redirecting sitemap URL remains: ${legacyExpression}`);
}

for (const relativePath of ["app/components/Hero.tsx", "app/components/Experts.tsx", "app/components/Opportunities.tsx", "app/components/TopRatedShowcase.tsx", "app/components/homepage/ResourcePreview.tsx", "app/components/Navbar.tsx", "app/components/Footer.tsx"]) {
  const source = await readFile(path.join(process.cwd(), relativePath), "utf8");
  assert.ok(source.includes("localized") || source.includes("getLocalizedPublicPathLocale"), `${relativePath} lacks locale-aware navigation`);
}

type MessageTree = string | { readonly [key: string]: MessageTree };
const canonicalMessages = JSON.parse(await readFile(path.join(process.cwd(), "messages/en.json"), "utf8")) as MessageTree;

function flattenMessages(tree: MessageTree, prefix = "", output = new Map<string, string>()): Map<string, string> {
  if (typeof tree === "string") {
    output.set(prefix, tree);
    return output;
  }
  for (const [key, value] of Object.entries(tree)) flattenMessages(value, prefix ? `${prefix}.${key}` : key, output);
  return output;
}

function collectArguments(value: unknown, output = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectArguments(item, output);
  else if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    if (typeof node.type === "number" && node.type !== 0 && typeof node.value === "string") output.add(node.value);
    for (const child of Object.values(node)) collectArguments(child, output);
  }
  return output;
}

const canonicalFlat = flattenMessages(canonicalMessages);
for (const locale of locales) {
  const messages = JSON.parse(await readFile(path.join(process.cwd(), `messages/${locale}.json`), "utf8")) as MessageTree;
  const flat = flattenMessages(messages);
  assert.deepEqual([...flat.keys()].sort(), [...canonicalFlat.keys()].sort(), `${locale}: translation key structure mismatch`);
  for (const [key, canonicalValue] of canonicalFlat) {
    const localizedValue = flat.get(key);
    if (localizedValue === undefined) throw new Error(`${locale}:${key}: missing translation`);
    const canonicalArguments = [...collectArguments(parse(canonicalValue))].sort();
    const localizedArguments = [...collectArguments(parse(localizedValue))].sort();
    assert.deepEqual(localizedArguments, canonicalArguments, `${locale}:${key}: ICU argument mismatch`);
  }
}

console.log(`Final locale-routing assertions passed for ${locales.length} locales, ${records.length} published content records, 307 redirects, sitemap capacity ${ENTITY_CLUSTERS_PER_SHARD}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
