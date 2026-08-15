import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TEST_PORT = 55432;
const DATABASE_PREFIX = "dasres_recovery_";
const CLOUD_HOST_PATTERNS = ["neon.tech", "neon.build", "supabase.co", "render.com", "railway.app", "amazonaws.com", "azure.com", "cloud.google.com", "pooler"];

function randomIdentifier(prefix: string): string {
  return `${prefix}${randomBytes(8).toString("hex")}`;
}

async function isPortOccupied(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: TEST_PORT });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", (error: NodeJS.ErrnoException) => {
      socket.destroy();
      if (error.code === "ECONNREFUSED") resolve(false);
      else reject(error);
    });
  });
}

function parseEnvironmentValue(source: string, name: string): string | undefined {
  const line = source.split(/\r?\n/).find((candidate) => candidate.trimStart().startsWith(`${name}=`));
  if (!line) return undefined;
  const value = line.slice(line.indexOf("=") + 1).trim();
  return value.replace(/^(['"])(.*)\1$/, "$2");
}

function assertSafeTestDatabase(testUrl: string, projectUrl?: string): URL {
  assert(testUrl, "TEST_DATABASE_URL must exist");
  assert(!projectUrl || testUrl !== projectUrl, "TEST_DATABASE_URL must differ from DATABASE_URL");
  const parsed = new URL(testUrl);
  assert.equal(parsed.protocol, "postgresql:", "TEST_DATABASE_URL must use PostgreSQL");
  assert(["127.0.0.1", "localhost"].includes(parsed.hostname), "Test database host must be local");
  assert.equal(parsed.port, String(TEST_PORT), `Test database port must be ${TEST_PORT}`);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  assert(databaseName.startsWith(DATABASE_PREFIX), `Test database name must start with ${DATABASE_PREFIX}`);
  const hostname = parsed.hostname.toLowerCase();
  assert(!CLOUD_HOST_PATTERNS.some((pattern) => hostname.includes(pattern)), "Cloud or pooled database hosts are forbidden");
  return parsed;
}

async function run(command: string, args: string[], environment: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code ?? "unknown"}`)));
  });
}

async function waitForPostgres(containerName: string, environment: NodeJS.ProcessEnv): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await execFileAsync("docker", ["exec", containerName, "pg_isready", "-q"], { env: environment }).catch(() => null);
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Disposable PostgreSQL did not become ready");
}

async function runSuite(): Promise<void> {
  const testUrl = process.env.TEST_DATABASE_URL;
  const projectUrl = process.env.PROJECT_DATABASE_URL_FOR_SAFETY;
  assert(testUrl, "TEST_DATABASE_URL must exist");
  assertSafeTestDatabase(testUrl, projectUrl);
  assert.equal(process.env.DATABASE_URL, testUrl, "Prisma DATABASE_URL must be the guarded disposable URL");

  const bcrypt = await import("bcryptjs");
  const { NextRequest } = await import("next/server");
  const { prisma } = await import("../../lib/prisma");
  const credentials = await import("../../lib/auth/credentials");
  const tokens = await import("../../lib/auth/identity-token");
  const rateLimits = await import("../../lib/auth/recovery-rate-limit");
  const { proxy } = await import("../../proxy");
  const { POST: forgotPassword } = await import("../../app/api/auth/forgot-password/route");

  const oldPassword = "Old-password-42";
  const newPassword = "New-password-84";
  const email = `${randomIdentifier("recovery_")}@example.test`;
  const oldHash = await credentials.hashPassword(oldPassword);
  const user = await prisma.user.create({ data: { name: "Recovery Integration", email, password: oldHash }, select: { id: true } });
  await prisma.session.createMany({ data: [1, 2, 3].map((suffix) => ({ userId: user.id, tokenHash: randomIdentifier(`session_${suffix}_`), expiresAt: new Date(Date.now() + 86_400_000) })) });

  const first = await tokens.issuePasswordResetToken(user.id);
  assert(first, "First token issuance must succeed");
  const firstRecord = await prisma.identityToken.findUniqueOrThrow({ where: { tokenHash: tokens.hashIdentityToken(first.rawToken) } });
  assert.equal(firstRecord.tokenHash, tokens.hashIdentityToken(first.rawToken));
  assert.notEqual(firstRecord.tokenHash, first.rawToken);
  assert.equal(firstRecord.purpose, "PASSWORD_RESET");
  assert(Math.abs(firstRecord.expiresAt.getTime() - firstRecord.createdAt.getTime() - tokens.PASSWORD_RESET_TOKEN_LIFETIME_MS) < 2_000);

  assert.equal(await tokens.issuePasswordResetToken(user.id), null, "Cooldown must suppress issuance");
  assert.equal(await prisma.identityToken.count({ where: { userId: user.id } }), 1);
  await prisma.identityToken.update({ where: { id: firstRecord.id }, data: { createdAt: new Date(Date.now() - tokens.PASSWORD_RESET_ISSUANCE_COOLDOWN_MS - 1_000) } });
  const second = await tokens.issuePasswordResetToken(user.id);
  assert(second, "Post-cooldown issuance must succeed");
  assert((await prisma.identityToken.findUniqueOrThrow({ where: { id: firstRecord.id } })).revokedAt);
  assert.equal(await tokens.resetPasswordWithToken(first.rawToken, await credentials.hashPassword("Rejected-password-1")), false);

  const expired = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: user.id, purpose: "PASSWORD_RESET", tokenHash: tokens.hashIdentityToken(expired), expiresAt: new Date(Date.now() - 1_000) } });
  assert.equal(await tokens.resetPasswordWithToken(expired, await credentials.hashPassword("Rejected-password-2")), false);
  const revoked = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: user.id, purpose: "PASSWORD_RESET", tokenHash: tokens.hashIdentityToken(revoked), expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date() } });
  assert.equal(await tokens.resetPasswordWithToken(revoked, await credentials.hashPassword("Rejected-password-3")), false);

  const otherActive = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: user.id, purpose: "PASSWORD_RESET", tokenHash: tokens.hashIdentityToken(otherActive), expiresAt: new Date(Date.now() + 60_000) } });
  const newHash = await credentials.hashPassword(newPassword);
  const concurrent = await Promise.all([tokens.resetPasswordWithToken(second.rawToken, newHash), tokens.resetPasswordWithToken(second.rawToken, newHash)]);
  assert.deepEqual([...concurrent].sort(), [false, true], "Exactly one concurrent reset must succeed");
  assert.equal(await tokens.resetPasswordWithToken(second.rawToken, newHash), false, "Consumed token replay must fail");
  const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { password: true } });
  assert.equal(await bcrypt.compare(oldPassword, updatedUser.password), false);
  assert.equal(await bcrypt.compare(newPassword, updatedUser.password), true);
  assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
  assert((await prisma.identityToken.findUniqueOrThrow({ where: { tokenHash: tokens.hashIdentityToken(otherActive) } })).revokedAt);

  const deliveryFailureToken = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: user.id, purpose: "PASSWORD_RESET", tokenHash: tokens.hashIdentityToken(deliveryFailureToken), expiresAt: new Date(Date.now() + 60_000) } });
  await tokens.revokePasswordResetToken(deliveryFailureToken);
  assert.equal(await tokens.resetPasswordWithToken(deliveryFailureToken, newHash), false);

  const unknownEmail = `${randomIdentifier("unknown_")}@example.test`;
  const originalInfo = console.info;
  console.info = () => undefined;
  let knownResponse: Response;
  let unknownResponse: Response;
  try {
    knownResponse = await forgotPassword(new Request("http://localhost/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }));
    unknownResponse = await forgotPassword(new Request("http://localhost/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: unknownEmail }) }));
  } finally { console.info = originalInfo; }
  assert.equal(knownResponse.status, unknownResponse.status);
  assert.deepEqual(await knownResponse.json(), await unknownResponse.json());
  assert.equal(knownResponse.headers.get("cache-control"), unknownResponse.headers.get("cache-control"));
  assert.equal(knownResponse.headers.get("cache-control"), "no-store");

  const accountBucket = rateLimits.getRecoveryAccountBucketForVerification(email);
  assert(!accountBucket.includes(email));
  for (let index = 0; index < 2; index += 1) rateLimits.enforceForgotAccountRateLimit(email);
  assert.throws(() => rateLimits.enforceForgotAccountRateLimit(email));
  const limiterTokenHash = tokens.hashIdentityToken(tokens.generateIdentityToken());
  for (let index = 0; index < 5; index += 1) rateLimits.enforceResetTokenRateLimit(limiterTokenHash);
  assert.throws(() => rateLimits.enforceResetTokenRateLimit(limiterTokenHash));

  process.env.VERCEL = "1";
  for (const [path, limit, ip] of [["forgot-password", 5, "192.0.2.41"], ["reset-password", 10, "192.0.2.42"]] as const) {
    for (let index = 0; index < limit; index += 1) {
      const response = await proxy(new NextRequest(`https://example.test/api/auth/${path}`, { method: "POST", headers: { origin: "https://example.test", "x-vercel-forwarded-for": ip } }));
      assert.notEqual(response.status, 429);
    }
    const blocked = await proxy(new NextRequest(`https://example.test/api/auth/${path}`, { method: "POST", headers: { origin: "https://example.test", "x-vercel-forwarded-for": ip } }));
    assert.equal(blocked.status, 429);
  }

  console.log("INTEGRATION TEST RESULTS: issuance, cooldown, supersession, expiry, revocation passed");
  console.log("CONCURRENCY RESULT: exactly one succeeded and one failed safely");
  console.log("PASSWORD RESULT: old rejected; new accepted");
  console.log("SESSION INVALIDATION RESULT: all sessions deleted");
  console.log("REPLAY RESULT: consumed token rejected");
  console.log("ROLLBACK RESULT: untested; no safe production failure-injection seam exists");
  console.log("RATE-LIMIT RESULT: forgot IP, account HMAC, reset IP, and token-hash buckets passed");
  await prisma.$disconnect();
}

async function main(): Promise<void> {
  if (process.argv.includes("--suite")) { await runSuite(); return; }
  assert(!process.env.TEST_DATABASE_URL, "Refusing to overwrite an existing TEST_DATABASE_URL");
  if (await isPortOccupied()) throw new Error(`Port ${TEST_PORT} is already occupied; refusing to continue`);

  const containerName = randomIdentifier("dasres-recovery-");
  const databaseName = randomIdentifier(DATABASE_PREFIX);
  const username = randomIdentifier("recovery_user_");
  const password = randomBytes(32).toString("base64url");
  const testUrl = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@127.0.0.1:${TEST_PORT}/${databaseName}`;
  const envFile = await readFile(".env", "utf8").catch(() => "");
  const projectUrl = process.env.DATABASE_URL ?? parseEnvironmentValue(envFile, "DATABASE_URL");
  const parsed = assertSafeTestDatabase(testUrl, projectUrl);
  const serverOnlyShim = pathToFileURL(path.join(process.cwd(), "scripts", "integration", "server-only-register.mjs")).href;
  const childEnvironment: NodeJS.ProcessEnv = { ...process.env, TEST_DATABASE_URL: testUrl, DATABASE_URL: testUrl, PROJECT_DATABASE_URL_FOR_SAFETY: projectUrl, NEXT_PUBLIC_SITE_URL: "https://example.test", ACCOUNT_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"), NODE_ENV: "test", NODE_OPTIONS: `--import=\"${serverOnlyShim}\"` };
  let started = false;
  try {
    console.log(`ISOLATION PROOF: host=${parsed.hostname} port=${parsed.port} database-prefix=${DATABASE_PREFIX} container=${containerName}`);
    console.log(`ISOLATION PROOF: TEST_DATABASE_URL differs from DATABASE_URL=${testUrl !== projectUrl}; Neon/cloud hostname=false`);
    await run("docker", ["run", "--rm", "-d", "--name", containerName, "-p", `127.0.0.1:${TEST_PORT}:5432`, "-e", `POSTGRES_DB=${databaseName}`, "-e", `POSTGRES_USER=${username}`, "-e", `POSTGRES_PASSWORD=${password}`, "postgres:16-alpine"], childEnvironment);
    started = true;
    await waitForPostgres(containerName, childEnvironment);
    await run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], childEnvironment);
    await run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "status"], childEnvironment);
    console.log("MIGRATIONS APPLIED TO DISPOSABLE DB: schema is current, including 20260808120000_identity_tokens");
    await run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/integration/account-recovery-postgres.ts", "--suite"], childEnvironment);
  } finally {
    delete process.env.TEST_DATABASE_URL;
    if (started) await execFileAsync("docker", ["stop", containerName], { env: process.env }).catch(() => undefined);
    const remaining = await execFileAsync("docker", ["ps", "-a", "--filter", `name=^/${containerName}$`, "--format", "{{.Names}}"], { env: process.env }).catch(() => ({ stdout: "unknown" }));
    assert.equal(remaining.stdout.trim(), "", "Disposable container cleanup failed");
    console.log("CLEANUP RESULT: disposable container removed; TEST_DATABASE_URL cleared; no volume created");
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown integration-test failure");
  process.exitCode = 1;
});
