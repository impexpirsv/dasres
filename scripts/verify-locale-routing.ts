import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { routing } from "../i18n/routing";
import {
  defaultLocale,
  isLocale,
  resolveLocale,
} from "../lib/locale";
import { getProxyBranch, proxy } from "../proxy";

assert.equal(isLocale("fa"), true);
assert.equal(isLocale("it"), true);
assert.equal(isLocale("nl"), false);
assert.equal(resolveLocale("fr", "de"), "fr");
assert.equal(resolveLocale(undefined, "de"), "de");
assert.equal(resolveLocale("unsupported", "unsupported"), defaultLocale);

assert.equal(getProxyBranch("/api/login"), "api");
assert.equal(getProxyBranch("/dashboard/settings"), "dashboard");
assert.equal(getProxyBranch("/login"), "auth");
assert.equal(getProxyBranch("/register"), "auth");
assert.equal(getProxyBranch("/en/dashboard"), "unknown");
assert.equal(getProxyBranch("/en/login"), "unknown");
assert.equal(getProxyBranch("/nl/about"), "unknown");

const apiResponse = proxy(
  new NextRequest("https://example.com/api/opportunities"),
);
assert.equal(apiResponse.headers.has("x-middleware-rewrite"), false);
assert.equal(apiResponse.headers.has("location"), false);

for (const pathname of ["/dashboard", "/login", "/register"]) {
  const response = proxy(new NextRequest(`https://example.com${pathname}?from=test`));
  assert.equal(response.headers.has("location"), false);
  assert.equal(response.headers.has("x-middleware-rewrite"), false);
}

const localizedResponse = proxy(
  new NextRequest("https://example.com/fr/about?from=test"),
);
assert.equal(localizedResponse.headers.has("location"), false);
assert.equal(
  localizedResponse.headers.get(
    "x-middleware-request-x-next-intl-locale",
  ),
  "fr",
);
assert.equal(localizedResponse.cookies.get("NEXT_LOCALE")?.value, "fr");

const rootResponse = proxy(new NextRequest("https://example.com/?from=test"));
assert.equal(rootResponse.headers.has("location"), false);
assert.equal(rootResponse.headers.has("x-middleware-rewrite"), false);

assert.equal(routing.localePrefix, "always");
assert.equal(routing.alternateLinks, false);

console.log("Locale routing contract assertions passed.");
