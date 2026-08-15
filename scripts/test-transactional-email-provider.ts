import assert from "node:assert/strict";
import "./integration/server-only-register.mjs";

type RecordedRequest = Readonly<{ url: string; init?: RequestInit }>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function runSuite(): Promise<void> {
  const providerModule = await import("../lib/email/resend-transactional-email-provider");
  const facade = await import("../lib/email/transactional-email");
  const urls = await import("../lib/email/canonical-email-url");
  const { getTransactionalEmailConfig } = await import("../lib/email/transactional-email-config");

  const originalEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TRANSACTIONAL_EMAIL_FROM: process.env.TRANSACTIONAL_EMAIL_FROM,
    TRANSACTIONAL_EMAIL_REPLY_TO: process.env.TRANSACTIONAL_EMAIL_REPLY_TO,
  };
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  const originalLog = console.log;
  const originalError = console.error;

  try {
    process.env.RESEND_API_KEY = "re_test_secret_value";
    process.env.TRANSACTIONAL_EMAIL_FROM = "Dasres <account@notify.dasres.com>";
    process.env.TRANSACTIONAL_EMAIL_REPLY_TO = "support@dasres.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://dasres.example";

    for (const [name, value] of [
      ["RESEND_API_KEY", ""],
      ["RESEND_API_KEY", "replace-with-resend-sending-only-api-key"],
      ["TRANSACTIONAL_EMAIL_FROM", "not-an-address"],
      ["TRANSACTIONAL_EMAIL_FROM", "Dasres <account@notify.example.com>"],
      ["TRANSACTIONAL_EMAIL_FROM", "Dasres\r\nBcc: attacker@example.com <account@example.com>"],
      ["TRANSACTIONAL_EMAIL_REPLY_TO", "bad"],
      ["TRANSACTIONAL_EMAIL_REPLY_TO", "support@example.com"],
      ["TRANSACTIONAL_EMAIL_REPLY_TO", "support@dasres.com\nBcc: attacker@example.com"],
    ] as const) {
      const previous = process.env[name];
      process.env[name] = value;
      assert.throws(() => getTransactionalEmailConfig(), `${name} must fail closed`);
      process.env[name] = previous;
    }

    Object.assign(process.env, { NODE_ENV: "production" });
    for (const invalidBase of [
      "http://dasres.example",
      "https://user:password@dasres.example",
      "https://dasres.example?source=unsafe",
      "https://dasres.example#unsafe",
    ]) {
      process.env.NEXT_PUBLIC_SITE_URL = invalidBase;
      assert.throws(() => urls.createCanonicalSecurityEmailUrl("/reset-password"));
    }
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    assert.equal(
      urls.createCanonicalSecurityEmailUrl("/api/auth/verify-email", { token: "a&b" }).toString(),
      "http://localhost:3000/api/auth/verify-email?token=a%26b",
    );
    process.env.NEXT_PUBLIC_SITE_URL = "http://example.test";
    assert.throws(() => urls.createCanonicalSecurityEmailUrl("/reset-password"));

    const requests: RecordedRequest[] = [];
    const successfulFetch: typeof fetch = async (input, init) => {
      requests.push({ url: input.toString(), init });
      return jsonResponse({ id: "provider_message_123" });
    };
    const config = {
      apiKey: "re_test_secret_value",
      from: "Dasres <account@notify.dasres.com>",
      replyTo: "support@dasres.com",
    } as const;
    const provider = new providerModule.ResendTransactionalEmailProvider(config, successfulFetch);
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
    console.log = originalLog;
    console.info = originalInfo;
    console.error = originalError;

    assert.equal(requests.length, 2);
    for (const request of requests) {
      assert.equal(request.url, "https://api.resend.com/emails");
      assert.equal(request.init?.method, "POST");
      assert.equal(request.init?.redirect, "manual");
      const headers = new Headers(request.init?.headers);
      assert.equal(headers.get("authorization"), "Bearer re_test_secret_value");
      assert.equal(headers.get("content-type"), "application/json");
      assert.match(headers.get("user-agent") ?? "", /^Dasres\//);
      const body = JSON.parse(String(request.init?.body)) as Record<string, unknown>;
      assert.equal(body.from, config.from);
      assert.equal(body.reply_to, config.replyTo);
      assert.equal(body.to instanceof Array, true);
      assert.equal(typeof body.text, "string");
      assert.equal(typeof body.html, "string");
      assert(!String(request.init?.body).includes(config.apiKey));
    }
    assert.match(String(JSON.parse(String(requests[0].init?.body)).subject), /Reset.*Dasres|Dasres.*password/i);
    assert.match(String(JSON.parse(String(requests[1].init?.body)).subject), /Verify.*Dasres|Dasres.*email/i);
    const combinedLogs = logs.join("\n");
    for (const sensitive of [rawToken, resetUrl.toString(), verificationUrl.toString(), config.apiKey, "recipient@example.com", "Reset password"]) {
      assert(!combinedLogs.includes(sensitive), `Logs exposed sensitive value: ${sensitive}`);
    }
    assert.match(combinedLogs, /providerMessageId/);

    async function expectCategory(fetchImplementation: typeof fetch, category: string, timeoutMs = 50): Promise<void> {
      const candidate = new providerModule.ResendTransactionalEmailProvider(config, fetchImplementation, timeoutMs);
      await assert.rejects(
        candidate.sendPasswordReset({ recipient: "recipient@example.com", resetUrl, expiresAt }),
        (error: unknown) => error instanceof providerModule.TransactionalEmailDeliveryError && error.category === category,
      );
    }

    console.error = () => undefined;
    await expectCategory(async () => { throw new Error("network unavailable"); }, "network");
    await expectCategory(async () => { throw new DOMException("aborted", "AbortError"); }, "timeout");
    await expectCategory((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }), "timeout", 5);
    for (const [status, category] of [[400, "validation"], [401, "authentication"], [403, "authentication"], [429, "rate_limited"], [500, "provider_unavailable"], [503, "provider_unavailable"], [302, "invalid_response"]] as const) {
      await expectCategory(async () => jsonResponse({ error: "provider detail" }, status), category);
    }
    await expectCategory(async () => new Response("not json", { status: 200 }), "invalid_response");
    await expectCategory(async () => jsonResponse({ unexpected: true }), "invalid_response");
    await expectCategory(async () => new Response("x".repeat(16_385), { status: 200 }), "invalid_response");

    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://dasres.example";
    globalThis.fetch = successfulFetch;
    await facade.sendPasswordResetEmail({ recipient: "recipient@example.com", resetUrl, expiresAt });
    const requestCountAfterProduction = requests.length;
    Object.assign(process.env, { NODE_ENV: "test" });
    let preview = "";
    console.info = (value?: unknown) => { preview += String(value); };
    await facade.sendPasswordResetEmail({ recipient: "recipient@example.com", resetUrl, expiresAt });
    assert.equal(requests.length, requestCountAfterProduction, "Non-production preview contacted Resend");
    assert.match(preview, /development email preview/);

    console.log = originalLog;
    console.log("Transactional email provider runtime tests passed with mocked fetch; no email was sent.");
  } finally {
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
    console.log = originalLog;
    console.error = originalError;
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

async function main(): Promise<void> {
  await runSuite();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown transactional-email test failure");
  process.exitCode = 1;
});
