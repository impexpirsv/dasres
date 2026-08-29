import assert from "node:assert/strict";
import "./integration/server-only-register.mjs";
import type Mail from "nodemailer/lib/mailer";

type MockTransport = Readonly<{ sendMail(message: Mail.Options): Promise<unknown> }>;

async function runSuite(): Promise<void> {
  const providerModule = await import("../lib/email/smtp-transactional-email-provider");
  const facade = await import("../lib/email/transactional-email");
  const urls = await import("../lib/email/canonical-email-url");
  const { getTransactionalEmailConfig } = await import("../lib/email/transactional-email-config");
  const environmentNames = ["NODE_ENV", "NEXT_PUBLIC_SITE_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USERNAME", "SMTP_PASSWORD", "TRANSACTIONAL_EMAIL_FROM", "TRANSACTIONAL_EMAIL_REPLY_TO"] as const;
  const originalEnvironment = Object.fromEntries(environmentNames.map((name) => [name, process.env[name]]));
  const originalInfo = console.info;
  const originalLog = console.log;
  const originalError = console.error;

  try {
    Object.assign(process.env, {
      SMTP_HOST: "smtp.dasres.com", SMTP_PORT: "465", SMTP_SECURE: "true",
      SMTP_USERNAME: "dasres-transactional", SMTP_PASSWORD: "smtp-test-secret-value",
      TRANSACTIONAL_EMAIL_FROM: "Dasres <account@notify.dasres.com>",
      TRANSACTIONAL_EMAIL_REPLY_TO: "support@dasres.com", NEXT_PUBLIC_SITE_URL: "https://dasres.example",
    });
    assert.deepEqual(getTransactionalEmailConfig(), {
      host: "smtp.dasres.com", port: 465, secure: true, username: "dasres-transactional",
      password: "smtp-test-secret-value", from: "Dasres <account@notify.dasres.com>", replyTo: "support@dasres.com",
    });

    for (const [name, value] of [
      ["SMTP_HOST", ""], ["SMTP_HOST", "smtp.dasres.com\nunsafe"],
      ["SMTP_PORT", ""], ["SMTP_PORT", "0"], ["SMTP_PORT", "65536"], ["SMTP_PORT", "25.5"], ["SMTP_PORT", " 25"],
      ["SMTP_SECURE", ""], ["SMTP_SECURE", "TRUE"], ["SMTP_SECURE", "1"], ["SMTP_SECURE", "false "],
      ["SMTP_USERNAME", ""], ["SMTP_USERNAME", "replace-with-username"], ["SMTP_USERNAME", "user\nname"],
      ["SMTP_PASSWORD", ""], ["SMTP_PASSWORD", "change-me"], ["SMTP_PASSWORD", "secret\rvalue"],
      ["TRANSACTIONAL_EMAIL_FROM", "not-an-address"], ["TRANSACTIONAL_EMAIL_FROM", "Dasres <account@notify.example.com>"],
      ["TRANSACTIONAL_EMAIL_FROM", "Dasres\r\nBcc: attacker@example.com <account@example.com>"],
      ["TRANSACTIONAL_EMAIL_REPLY_TO", "bad"], ["TRANSACTIONAL_EMAIL_REPLY_TO", "support@example.com"],
      ["TRANSACTIONAL_EMAIL_REPLY_TO", "support@dasres.com\nBcc: attacker@example.com"],
    ] as const) {
      const previous = process.env[name]; process.env[name] = value;
      assert.throws(() => getTransactionalEmailConfig(), `${name}=${JSON.stringify(value)} must fail closed`);
      process.env[name] = previous;
    }

    Object.assign(process.env, { NODE_ENV: "production" });
    for (const invalidBase of ["http://dasres.example", "https://user:password@dasres.example", "https://dasres.example?source=unsafe", "https://dasres.example#unsafe"]) {
      process.env.NEXT_PUBLIC_SITE_URL = invalidBase; assert.throws(() => urls.createCanonicalSecurityEmailUrl("/reset-password"));
    }
    Object.assign(process.env, { NODE_ENV: "test", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
    assert.equal(urls.createCanonicalSecurityEmailUrl("/api/auth/verify-email", { token: "a&b" }).toString(), "http://localhost:3000/api/auth/verify-email?token=a%26b");
    process.env.NEXT_PUBLIC_SITE_URL = "http://example.test"; assert.throws(() => urls.createCanonicalSecurityEmailUrl("/reset-password"));

    const config = getTransactionalEmailConfig();
    const messages: Mail.Options[] = [];
    const successfulTransport: MockTransport = { async sendMail(message) { messages.push(message); return { messageId: "smtp-message-123" }; } };
    const provider = new providerModule.SmtpTransactionalEmailProvider(config, successfulTransport);
    const rawToken = "raw-secret-token";
    const resetUrl = new URL(`https://dasres.example/reset-password?token=${rawToken}`);
    const verificationUrl = new URL(`https://dasres.example/api/auth/verify-email?token=${rawToken}`);
    const expiresAt = new Date("2026-08-15T14:00:00.000Z");
    const logs: string[] = [];
    console.log = (...values: unknown[]) => logs.push(values.map(String).join(" "));
    console.info = (...values: unknown[]) => logs.push(values.map(String).join(" "));
    console.error = (...values: unknown[]) => logs.push(values.map(String).join(" "));
    await provider.sendPasswordReset({ recipient: "recipient@example.com", resetUrl, expiresAt });
    await provider.sendEmailVerification({ recipient: "recipient@example.com", verificationUrl, expiresAt });
    assert.equal(messages.length, 2);
    for (const message of messages) {
      assert.equal(message.from, config.from); assert.equal(message.to, "recipient@example.com"); assert.equal(message.replyTo, config.replyTo);
      assert.equal(typeof message.text, "string"); assert.equal(typeof message.html, "string");
    }
    assert.match(String(messages[0].subject), /Reset.*Dasres|Dasres.*password/i);
    assert.match(String(messages[1].subject), /Verify.*Dasres|Dasres.*email/i);
    for (const sensitive of [rawToken, resetUrl.toString(), verificationUrl.toString(), config.username, config.password, "recipient@example.com", "Reset password"]) {
      assert(!logs.join("\n").includes(sensitive), `Logs exposed sensitive value: ${sensitive}`);
    }
    assert.match(logs.join("\n"), /providerMessageId/);

    async function expectCategory(error: unknown, category: string, timeoutMs = 50): Promise<void> {
      const transport: MockTransport = { async sendMail() { if (error === "hang") return new Promise(() => undefined); throw error; } };
      const candidate = new providerModule.SmtpTransactionalEmailProvider(config, transport, timeoutMs);
      await assert.rejects(candidate.sendPasswordReset({ recipient: "recipient@example.com", resetUrl, expiresAt }),
        (failure: unknown) => failure instanceof providerModule.TransactionalEmailDeliveryError && failure.category === category);
    }
    await expectCategory({ code: "ETIMEDOUT", response: `secret ${config.password}` }, "timeout");
    await expectCategory({ code: "ECONNECTION", response: "recipient@example.com rejected" }, "network");
    await expectCategory({ code: "EAUTH", response: `535 password=${config.password}` }, "authentication");
    await expectCategory({ code: "ECONFIG" }, "configuration"); await expectCategory({ code: "EENVELOPE" }, "validation");
    await expectCategory({ responseCode: 452 }, "rate_limited"); await expectCategory({ responseCode: 421 }, "provider_unavailable");
    await expectCategory(new Error(`unexpected ${rawToken}`), "invalid_response"); await expectCategory("hang", "timeout", 5);
    for (const sensitive of [rawToken, config.password, "recipient@example.com", "535 password="]) assert(!logs.join("\n").includes(sensitive));

    Object.assign(process.env, { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://dasres.example" });
    const previousHost = process.env.SMTP_HOST; delete process.env.SMTP_HOST;
    assert.throws(() => facade.assertTransactionalEmailConfigured()); process.env.SMTP_HOST = previousHost;
    facade.assertTransactionalEmailConfigured();
    Object.assign(process.env, { NODE_ENV: "test" });
    let preview = ""; console.info = (value?: unknown) => { preview += String(value); };
    await facade.sendPasswordResetEmail({ recipient: "recipient@example.com", resetUrl, expiresAt });
    assert.match(preview, /development email preview/);
    console.log = originalLog; console.log("Transactional email provider runtime tests passed with mocked SMTP; no email was sent.");
  } finally {
    console.info = originalInfo; console.log = originalLog; console.error = originalError;
    for (const name of environmentNames) {
      const value = originalEnvironment[name];
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else Reflect.set(process.env, name, value);
    }
  }
}

void runSuite().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Unknown transactional-email test failure"); process.exitCode = 1; });
