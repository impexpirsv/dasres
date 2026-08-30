import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const read = (relativePath: string) => readFile(path.join(process.cwd(), relativePath), "utf8");

async function main(): Promise<void> {
  const [facade, provider, config, canonicalUrl, content, forgot, resend, timing, environmentExample, integration] = await Promise.all([
    read("lib/email/transactional-email.ts"),
    read("lib/email/smtp-transactional-email-provider.ts"),
    read("lib/email/transactional-email-config.ts"),
    read("lib/email/canonical-email-url.ts"),
    read("lib/email/transactional-email-content.ts"),
    read("app/api/auth/forgot-password/route.ts"),
    read("app/api/auth/resend-verification/route.ts"),
    read("lib/auth/generic-response-timing.ts"),
    read(".env.example"),
    read("scripts/integration/account-recovery-postgres.ts"),
  ]);

  assert.match(facade, /process\.env\.NODE_ENV === "production"[\s\S]*SmtpTransactionalEmailProvider/);
  assert.match(facade, /DevelopmentEmailProvider/);
  assert.match(provider, /nodemailer\.createTransport/);
  assert.match(provider, /connectionTimeout: CONNECTION_TIMEOUT_MS/);
  assert.match(provider, /greetingTimeout: GREETING_TIMEOUT_MS/);
  assert.match(provider, /socketTimeout: SOCKET_TIMEOUT_MS/);
  assert.match(provider, /net\.connect\(\{ host: config\.host, port: config\.port \}\)/);
  assert.match(provider, /getSocket/);
  assert.match(provider, /DELIVERY_TIMEOUT_MS = 15_000/);
  assert.match(provider, /Promise\.race/);
  for (const name of ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USERNAME", "SMTP_PASSWORD"]) assert.match(config, new RegExp(name));
  assert.match(config, /TRANSACTIONAL_EMAIL_FROM/);
  assert.match(config, /TRANSACTIONAL_EMAIL_REPLY_TO/);
  assert.match(config, /CONTROL_CHARACTER_PATTERN/);
  assert.match(config, /PLACEHOLDER_CREDENTIAL_PATTERN/);
  assert.match(config, /RESERVED_PLACEHOLDER_DOMAIN_PATTERN/);
  assert.match(canonicalUrl, /siteUrl\.protocol === "https:"/);
  assert.match(canonicalUrl, /localhost/);
  assert.match(canonicalUrl, /siteUrl\.search/);
  assert.match(canonicalUrl, /siteUrl\.hash/);
  assert.match(content, /createPasswordResetEmailContent/);
  assert.match(content, /createEmailVerificationContent/);
  assert.match(content, /text:/);
  assert.match(content, /html:/);
  assert.match(forgot, /waitForGenericAuthResponse/);
  assert.match(resend, /waitForGenericAuthResponse/);
  assert.match(timing, /MINIMUM_RESPONSE_TIME_MS = 850/);
  assert.match(timing, /RESPONSE_JITTER_RANGE_MS = 150/);
  for (const name of ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USERNAME", "SMTP_PASSWORD"]) assert.match(environmentExample, new RegExp(`^${name}=`, "m"));
  assert.doesNotMatch(environmentExample, /^RESEND_API_KEY=/m);
  assert.doesNotMatch(provider, /console\.(?:log|info|warn|error)/);
  assert.match(integration, /NODE_ENV: "test"/);
  assert.doesNotMatch(integration, /SMTP_(?:HOST|PORT|SECURE|USERNAME|PASSWORD)|TRANSACTIONAL_EMAIL_FROM/);

  console.log("Transactional email static verification passed.");
  console.log("Runtime provider behavior is covered separately by mocked SMTP transport tests.");
}

void main();
