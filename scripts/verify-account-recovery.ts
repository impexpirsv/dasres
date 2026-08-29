import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "@formatjs/icu-messageformat-parser";
import { NextRequest } from "next/server";

import { getProxyBranch, proxy } from "../proxy";

const root = process.cwd();
const read = (relativePath: string) => readFile(path.join(root, relativePath), "utf8");

function flatten(value: unknown, prefix = "", output = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") { output.set(prefix, value); return output; }
  assert(value && typeof value === "object" && !Array.isArray(value), `Invalid catalog value at ${prefix}`);
  for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, output);
  return output;
}

async function main(): Promise<void> {
  const [schema, migration, proxySource, registrationApi, registrationPage, tokenService, forgotApi, resetApi, emailProvider, emailConfig, rateLimits, identityRateLimits, boundedJson] = await Promise.all([
    read("prisma/schema.prisma"), read("prisma/migrations/20260808120000_identity_tokens/migration.sql"), read("proxy.ts"),
    read("app/api/register/route.ts"), read("app/register/page.tsx"), read("lib/auth/identity-token.ts"),
    read("app/api/auth/forgot-password/route.ts"), read("app/api/auth/reset-password/route.ts"),
    read("lib/email/transactional-email.ts"), read("lib/email/transactional-email-config.ts"), read("lib/auth/recovery-rate-limit.ts"), read("lib/auth/identity-rate-limit.ts"),
    read("lib/http/bounded-json.ts"),
  ]);

  assert.match(schema, /enum IdentityTokenPurpose[\s\S]*PASSWORD_RESET[\s\S]*EMAIL_VERIFICATION[\s\S]*EMAIL_CHANGE/);
  assert.match(migration, /CREATE TABLE "IdentityToken"/);
  assert.doesNotMatch(migration, /^\s*(?:UPDATE|DELETE FROM|DROP|ALTER TABLE "User")/im);
  assert.match(registrationApi, /from "\.\.\/\.\.\/\.\.\/lib\/auth\/credentials"/);
  assert.match(registrationPage, /minLength=\{8\}/);
  assert.match(tokenService, /randomBytes\(32\)/);
  assert.match(tokenService, /createHash\("sha256"\)/);
  assert.doesNotMatch(tokenService, /rawToken\s*[:,]\s*rawToken/);
  assert.match(tokenService, /purpose: "PASSWORD_RESET"/);
  assert.match(tokenService, /consumedAt: now/);
  assert.match(tokenService, /session\.deleteMany/);
  assert.match(tokenService, /TransactionIsolationLevel\.Serializable/);
  assert.match(forgotApi, /PASSWORD_RESET_REQUEST_ACCEPTED/);
  assert.doesNotMatch(forgotApi, /Response\.json\([^)]*rawToken/);
  assert.match(resetApi, /RESET_COOKIE_NAME/);
  assert.doesNotMatch(resetApi, /payload\.token/);
  assert.match(proxySource, /forgot-password\|reset-password/);
  assert.match(proxySource, /sameSite: "strict"/);
  assert.match(proxySource, /path: "\/api\/auth\/reset-password"/);
  assert.match(proxySource, /password-recovery-forgot[\s\S]*limit: 5[\s\S]*15 \* 60_000/);
  assert.match(proxySource, /password-recovery-reset[\s\S]*limit: 10[\s\S]*15 \* 60_000/);
  assert.match(identityRateLimits, /createHmac\("sha256"/);
  assert.doesNotMatch(rateLimits, /forgot-account:\$\{normalizedEmail\}/);
  assert.match(rateLimits, /forgot-account:\$\{keyedIdentityIdentifier\(normalizedEmail\)\}/);
  assert.match(emailProvider, /process\.env\.NODE_ENV === "production"/);
  assert.match(emailProvider, /SmtpTransactionalEmailProvider/);
  assert.match(emailConfig, /TRANSACTIONAL_EMAIL_NOT_CONFIGURED/);
  assert.match(identityRateLimits, /configured !== DOCUMENTED_EXAMPLE_SECRET/);
  assert.match(boundedJson, /request\.body\.getReader\(\)/);
  assert.match(boundedJson, /receivedBytes > maximumBytes/);

  assert.equal(getProxyBranch("/forgot-password"), "auth");
  assert.equal(getProxyBranch("/reset-password"), "auth");
  for (const locale of ["ar", "de", "en", "es", "fa", "fr", "it", "ja", "pt", "ru", "tr", "zh"]) {
    assert.equal(getProxyBranch(`/${locale}/forgot-password`), "unknown");
    assert.equal(getProxyBranch(`/${locale}/reset-password`), "unknown");
  }
  const rawToken = "A".repeat(43);
  const exchange = await proxy(new NextRequest(`https://example.com/reset-password?token=${rawToken}`));
  assert.equal(exchange.status, 303);
  assert.equal(exchange.headers.get("location"), "https://example.com/reset-password");
  assert.equal(exchange.headers.get("cache-control"), "no-store");
  const exchangeCookie = exchange.headers.get("set-cookie") ?? "";
  assert.match(exchangeCookie, /HttpOnly/i);
  assert.match(exchangeCookie, /SameSite=Strict/i);
  assert.match(exchangeCookie, /Path=\/api\/auth\/reset-password/i);
  assert.match(exchangeCookie, /Max-Age=1800/i);
  const malformed = await proxy(new NextRequest("https://example.com/reset-password?token=bad"));
  assert.match(malformed.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  const crossOrigin = await proxy(new NextRequest("https://example.com/api/auth/forgot-password", {
    method: "POST",
    headers: { origin: "https://attacker.example", "content-type": "application/json", "x-vercel-forwarded-for": "192.0.2.1" },
    body: JSON.stringify({ email: "person@example.com" }),
  }));
  assert.equal(crossOrigin.status, 403);

  const locales = ["ar", "de", "en", "es", "fa", "fr", "it", "ja", "pt", "ru", "tr", "zh"];
  const canonical = flatten(JSON.parse(await read("messages/en.json")) as unknown);
  for (const locale of locales) {
    const catalog = flatten(JSON.parse(await read(`messages/${locale}.json`)) as unknown);
    assert.deepEqual([...catalog.keys()].sort(), [...canonical.keys()].sort(), `${locale} key structure differs`);
    for (const message of catalog.values()) parse(message, { requiresOtherClause: false });
    assert(catalog.has("forgotPasswordPage.title"));
    assert(catalog.has("resetPasswordPage.title"));
  }

  console.log("Account Recovery Batch A source and catalog verification passed.");
  console.log("Database mutation/concurrency scenarios require an isolated PostgreSQL test database and are intentionally not run here.");
}

void main();
