import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "@formatjs/icu-messageformat-parser";

import { getProxyBranch } from "../proxy";

const root = process.cwd();
const read = (relativePath: string) => readFile(path.join(root, relativePath), "utf8");
const locales = ["ar", "de", "en", "es", "fa", "fr", "it", "ja", "pt", "ru", "tr", "zh"] as const;

function flatten(value: unknown, prefix = "", output = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") { output.set(prefix, value); return output; }
  assert(value && typeof value === "object" && !Array.isArray(value), `Invalid catalog value at ${prefix}`);
  for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, output);
  return output;
}

async function main(): Promise<void> {
  const [schema, migration, tokens, registration, login, loginSession, verifyApi, resendApi, emailProvider, boundedJson, proxy, recoveryVerifier] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20260815120000_email_verification/migration.sql"),
    read("lib/auth/identity-token.ts"),
    read("app/api/register/route.ts"),
    read("app/api/login/route.ts"),
    read("lib/auth/login-session.ts"),
    read("app/api/auth/verify-email/route.ts"),
    read("app/api/auth/resend-verification/route.ts"),
    read("lib/email/transactional-email.ts"),
    read("lib/http/bounded-json.ts"),
    read("proxy.ts"),
    read("scripts/verify-account-recovery.ts"),
  ]);

  assert.match(schema, /emailVerifiedAt\s+DateTime\?/);
  assert.doesNotMatch(schema, /emailVerifiedAt\s+DateTime\?[^\n]*@default/);
  assert.match(schema, /enum IdentityTokenPurpose[\s\S]*EMAIL_VERIFICATION/);
  assert.match(migration, /ADD COLUMN "emailVerifiedAt" TIMESTAMP\(3\)/);
  assert.match(migration, /UPDATE "User"[\s\S]*CURRENT_TIMESTAMP[\s\S]*WHERE "emailVerifiedAt" IS NULL/);
  assert.doesNotMatch(migration, /DEFAULT|DROP|DELETE FROM/i);
  assert.match(tokens, /randomBytes\(32\)/);
  assert.match(tokens, /createHash\("sha256"\)/);
  assert.match(tokens, /purpose: "EMAIL_VERIFICATION"/);
  assert.match(tokens, /targetEmail: normalizedEmail/);
  assert.match(tokens, /record\.targetEmail !== record\.user\.email/);
  assert.match(tokens, /emailVerifiedAt: now/);
  assert.match(tokens, /TransactionIsolationLevel\.Serializable/);
  assert.match(registration, /runSerializableIdentityTransaction/);
  assert.match(registration, /createEmailVerificationToken\(transaction/);
  assert.match(registration, /assertTransactionalEmailConfigured\(\)/);
  assert.doesNotMatch(registration, /Response\.json\([^)]*rawToken/);
  assert.match(login, /createLoginSession\(user\.id\)/);
  assert.match(loginSession, /emailVerifiedAt/);
  assert.match(loginSession, /EMAIL_VERIFICATION_REQUIRED/);
  assert(loginSession.indexOf("EMAIL_VERIFICATION_REQUIRED") < loginSession.indexOf("session.create"));
  assert.match(resendApi, /EMAIL_VERIFICATION_RESEND_ACCEPTED/);
  assert.match(resendApi, /parseBoundedJsonObject/);
  assert.match(emailProvider, /process\.env\.NODE_ENV !== "production"/);
  assert.match(emailProvider, /TRANSACTIONAL_EMAIL_NOT_CONFIGURED/);
  assert.match(verifyApi, /NextResponse\.redirect[\s\S]*303/);
  assert.doesNotMatch(verifyApi, /cookies|set-cookie|returnTo|callback/i);
  assert.match(boundedJson, /contentType !== "application\/json"/);
  assert.match(proxy, /email-verification-resend[\s\S]*limit: 5[\s\S]*15 \* 60_000/);
  assert.match(recoveryVerifier, /PASSWORD_RESET/);

  assert.equal(getProxyBranch("/verify-email"), "auth");
  for (const locale of locales) assert.equal(getProxyBranch(`/${locale}/verify-email`), "unknown");

  const canonical = flatten(JSON.parse(await read("messages/en.json")) as unknown);
  const requiredKeys = [
    "registerPage.verificationRequired", "registerPage.verificationEmailSent", "registerPage.continueToVerification",
    "loginPage.emailVerificationRequired", "loginPage.resendVerification", "loginPage.verificationResent",
    "verifyEmailPage.title", "verifyEmailPage.description", "verifyEmailPage.verifying", "verifyEmailPage.success",
    "verifyEmailPage.invalidOrExpired", "verifyEmailPage.alreadyVerified", "verifyEmailPage.continueToLogin",
    "verifyEmailPage.resendTitle", "verifyEmailPage.resendDescription", "verifyEmailPage.emailLabel",
    "verifyEmailPage.resend", "verifyEmailPage.resending", "verifyEmailPage.resendAccepted", "verifyEmailPage.error",
  ];
  for (const key of requiredKeys) assert(canonical.has(key), `Missing canonical message ${key}`);
  for (const locale of locales) {
    const catalog = flatten(JSON.parse(await read(`messages/${locale}.json`)) as unknown);
    assert.deepEqual([...catalog.keys()].sort(), [...canonical.keys()].sort(), `${locale} key structure differs`);
    for (const message of catalog.values()) parse(message, { requiresOtherClause: false });
    if (locale !== "en") {
      for (const key of requiredKeys) assert.notEqual(catalog.get(key), canonical.get(key), `${locale} copied English at ${key}`);
    }
  }

  console.log("Account Identity Batch B email-verification source and catalog verification passed.");
}

void main();
