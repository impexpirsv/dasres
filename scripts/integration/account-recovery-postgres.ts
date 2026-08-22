import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import net from "node:net";
import http from "node:http";
import { once } from "node:events";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DATABASE_PREFIX = "dasres_recovery_";
const CLOUD_HOST_PATTERNS = ["neon.tech", "neon.build", "supabase.co", "render.com", "railway.app", "amazonaws.com", "azure.com", "cloud.google.com", "pooler"];

function randomIdentifier(prefix: string): string {
  return `${prefix}${randomBytes(8).toString("hex")}`;
}

async function selectLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("Failed to select loopback port")));
      const selectedPort = address.port;
      server.close((error) => error ? reject(error) : resolve(selectedPort));
    });
  });
}

async function isLoopbackPortListening(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", (error: NodeJS.ErrnoException) => {
      socket.destroy();
      if (error.code === "ECONNREFUSED") resolve(false);
      else reject(error);
    });
  });
}

async function runFileRouteHttpSuite(environment: NodeJS.ProcessEnv, containerName: string, databaseName: string, username: string): Promise<void> {
  const port = await selectLoopbackPort();
  const objectPort = await selectLoopbackPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const { NODE_OPTIONS: omittedNodeOptions, ...environmentWithoutNodeOptions } = environment;
  void omittedNodeOptions;
  const imageBytes = Buffer.from("batch-c-public-image");
  const imageChecksum = createHash("sha256").update(imageBytes).digest("hex");
  const keys = {
    company: "quarantine/company-logo/2026/08/11111111-1111-4111-8111-111111111111",
    expert: "quarantine/expert-image/2026/08/22222222-2222-4222-8222-222222222222",
    opportunity: "quarantine/opportunity-image/2026/08/33333333-3333-4333-8333-333333333333",
  } as const;
  const objects = new Map<string, Buffer>(Object.values(keys).map((key) => [key, imageBytes]));
  const objectServer = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${objectPort}`).pathname);
    const bytes = objects.get(pathname.split("/").slice(2).join("/"));
    if (request.method !== "GET" || !bytes) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "content-length": String(bytes.length), "content-type": "image/png" });
    response.write(bytes.subarray(0, 5)); setImmediate(() => response.end(bytes.subarray(5)));
  });
  await new Promise<void>((resolve) => objectServer.listen(objectPort, "127.0.0.1", resolve));
  const serverEnvironment: NodeJS.ProcessEnv = {
    ...environmentWithoutNodeOptions, NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: baseUrl,
    OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${objectPort}`, OBJECT_STORAGE_REGION: "auto", OBJECT_STORAGE_BUCKET: "test-images",
    OBJECT_STORAGE_ACCESS_KEY_ID: "test-access-key", OBJECT_STORAGE_SECRET_ACCESS_KEY: "test-secret-key",
    OBJECT_STORAGE_ALLOW_INSECURE_LOOPBACK_TESTS: "1",
  };
  const values = (key: string, status: string | null, complete = true): string => complete
    ? `'${key}','r2','image/png',${imageBytes.length},'${imageChecksum}',${status ? `'${status}'` : "NULL"},NOW(),'clamav',1`
    : `'${key}','r2',NULL,NULL,NULL,'CLEAN',NOW(),'clamav',1`;
  await runPostgresSql(containerName, databaseName, username, `
    INSERT INTO "Company" ("id","name","country","category","status","description","email","website","logoUrl","logoStorageKey","logoStorageProvider","logoMimeType","logoFileSize","logoChecksumSha256","logoScanStatus","logoScannedAt","logoScanEngine","logoScanAttempts") VALUES
    (900001,'HTTP Company','IR','Tech','Active','HTTP','http-company@example.test','https://example.test','/api/images/company/900001',${values(keys.company,"CLEAN")}),
    (900011,'Pending Company','IR','Tech','Active','HTTP','pending-company@example.test','https://example.test','/api/images/company/900011',${values("quarantine/company-logo/2026/08/41111111-1111-4111-8111-111111111111","PENDING_SCAN")}),
    (900012,'Infected Company','IR','Tech','Active','HTTP','infected-company@example.test','https://example.test','/api/images/company/900012',${values("quarantine/company-logo/2026/08/51111111-1111-4111-8111-111111111111","INFECTED")}),
    (900013,'Failed Company','IR','Tech','Active','HTTP','failed-company@example.test','https://example.test','/api/images/company/900013',${values("quarantine/company-logo/2026/08/61111111-1111-4111-8111-111111111111","SCAN_FAILED")}),
    (900014,'Null Company','IR','Tech','Active','HTTP','null-company@example.test','https://example.test','/api/images/company/900014',${values("quarantine/company-logo/2026/08/71111111-1111-4111-8111-111111111111",null)}),
    (900015,'Partial Company','IR','Tech','Active','HTTP','partial-company@example.test','https://example.test','/api/images/company/900015',${values("quarantine/company-logo/2026/08/81111111-1111-4111-8111-111111111111","CLEAN",false)});
    INSERT INTO "Expert" ("id","name","country","specialty","status","experience","email","imageUrl","imageStorageKey","imageStorageProvider","imageMimeType","imageFileSize","imageChecksumSha256","imageScanStatus","imageScannedAt","imageScanEngine","imageScanAttempts") VALUES
    (900002,'HTTP Expert','IR','Security','Active','HTTP','http-expert@example.test','/api/images/expert/900002',${values(keys.expert,"CLEAN")});
    INSERT INTO "Opportunity" ("id","title","country","status","description","imageUrl","imageStorageKey","imageStorageProvider","imageMimeType","imageFileSize","imageChecksumSha256","imageScanStatus","imageScannedAt","imageScanEngine","imageScanAttempts") VALUES
    (900003,'HTTP Opportunity','IR','Open','HTTP','/api/images/opportunity/900003',${values(keys.opportunity,"CLEAN")});
  `, serverEnvironment);
  await run(process.execPath, ["node_modules/next/dist/bin/next", "build"], serverEnvironment);
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env: serverEnvironment, stdio: "pipe", windowsHide: true,
  });
  server.stdin.end();
  let diagnostics = "";
  server.stdout?.on("data", (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8_000); });
  server.stderr?.on("data", (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8_000); });
  try {
    const deadline = Date.now() + 60_000;
    while (true) {
      if (server.exitCode !== null) throw new Error(`Next route test server exited early:\n${diagnostics}`);
      const ready = await fetch(`${baseUrl}/api/cases/1/documents`, { method: "OPTIONS" }).catch(() => null);
      if (ready) break;
      if (Date.now() >= deadline) throw new Error(`Next route test server did not become ready:\n${diagnostics}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const requests: ReadonlyArray<readonly [string, RequestInit]> = [
      ["/api/cases/1/documents", { method: "POST", body: "unauthenticated" }],
      ["/api/cases/documents/1/download", { method: "GET" }],
      ["/api/cases/documents/1/download", { method: "DELETE" }],
      ["/api/project-tasks/1/attachments", { method: "POST", body: "unauthenticated" }],
      ["/api/project-task-attachments/1/download", { method: "GET" }],
      ["/api/project-task-attachments/1/download", { method: "DELETE" }],
      ["/api/companies", { method: "POST", body: "unauthenticated" }],
      ["/api/companies/1", { method: "PUT", body: "unauthenticated" }],
      ["/api/experts", { method: "POST", body: "unauthenticated" }],
      ["/api/experts/1", { method: "PUT", body: "unauthenticated" }],
      ["/api/opportunities", { method: "POST", body: "unauthenticated" }],
      ["/api/opportunities/1", { method: "PUT", body: "unauthenticated" }],
    ];
    for (const [pathname, init] of requests) {
      const response = await fetch(`${baseUrl}${pathname}`, { ...init, headers: { Origin: baseUrl }, redirect: "manual" });
      assert.equal(response.status, 401, `${init.method} ${pathname} must reject unauthenticated HTTP requests`);
      const body = await response.json() as { code?: unknown };
      assert.equal(body.code, "UNAUTHENTICATED");
    }
    for (const pathname of ["/api/images/company/900001", "/api/images/expert/900002", "/api/images/opportunity/900003"]) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "image/png");
      assert.equal(response.headers.get("content-length"), String(imageBytes.length)); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("content-disposition"), "inline"); assert.match(response.headers.get("cache-control") ?? "", /max-age=300/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), imageBytes);
    }
    for (const pathname of ["/api/images/company/900011", "/api/images/company/900012", "/api/images/company/900013", "/api/images/company/900014", "/api/images/company/900015", "/api/images/company/999999", "/api/images/unknown/900001"]) {
      assert.equal((await fetch(`${baseUrl}${pathname}`)).status, 404, `${pathname} must not render`);
    }
    console.log(`FILE ROUTE HTTP RESULT: twelve unauthenticated file/image mutation requests rejected with 401 on loopback port ${port}`);
  } finally {
    if (server.exitCode === null) server.kill();
    if (server.exitCode === null) await once(server, "exit").catch(() => undefined);
    assert.equal(await isLoopbackPortListening(port), false, "Next route test port cleanup failed");
    await new Promise<void>((resolve, reject) => objectServer.close((error) => error ? reject(error) : resolve()));
    assert.equal(await isLoopbackPortListening(objectPort), false, "Object test port cleanup failed");
  }
}

function parseEnvironmentValue(source: string, name: string): string | undefined {
  const line = source.split(/\r?\n/).find((candidate) => candidate.trimStart().startsWith(`${name}=`));
  if (!line) return undefined;
  const value = line.slice(line.indexOf("=") + 1).trim();
  return value.replace(/^(['"])(.*)\1$/, "$2");
}

function assertSafeTestDatabase(testUrl: string, expectedPort: number, projectUrl?: string): URL {
  assert(testUrl, "TEST_DATABASE_URL must exist");
  assert(!projectUrl || testUrl !== projectUrl, "TEST_DATABASE_URL must differ from DATABASE_URL");
  const parsed = new URL(testUrl);
  assert.equal(parsed.protocol, "postgresql:", "TEST_DATABASE_URL must use PostgreSQL");
  assert(["127.0.0.1", "localhost"].includes(parsed.hostname), "Test database host must be local");
  assert(Number.isInteger(expectedPort) && expectedPort >= 1024 && expectedPort <= 65535, "Selected test port must be a high TCP port");
  assert.equal(parsed.port, String(expectedPort), `Test database port must be ${expectedPort}`);
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

async function runPostgresSql(
  containerName: string,
  databaseName: string,
  username: string,
  sql: string,
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", containerName, "psql", "-v", "ON_ERROR_STOP=1", "-U", username, "-d", databaseName], {
      env: environment,
      stdio: ["pipe", "inherit", "inherit"],
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`psql exited with code ${code ?? "unknown"}`)));
    child.stdin.end(sql);
  });
}

async function runSuite(): Promise<void> {
  const testUrl = process.env.TEST_DATABASE_URL;
  const projectUrl = process.env.PROJECT_DATABASE_URL_FOR_SAFETY;
  const expectedPort = Number(process.env.TEST_DATABASE_PORT);
  assert(testUrl, "TEST_DATABASE_URL must exist");
  assertSafeTestDatabase(testUrl, expectedPort, projectUrl);
  assert.equal(process.env.DATABASE_URL, testUrl, "Prisma DATABASE_URL must be the guarded disposable URL");

  const bcrypt = await import("bcryptjs");
  const { NextRequest } = await import("next/server");
  const { prisma } = await import("../../lib/prisma");
  const credentials = await import("../../lib/auth/credentials");
  const tokens = await import("../../lib/auth/identity-token");
  const rateLimits = await import("../../lib/auth/recovery-rate-limit");
  const { proxy } = await import("../../proxy");
  const { POST: forgotPassword } = await import("../../app/api/auth/forgot-password/route");
  const { POST: register } = await import("../../app/api/register/route");
  const { POST: login } = await import("../../app/api/login/route");
  const { POST: resendVerification } = await import("../../app/api/auth/resend-verification/route");
  const verificationRateLimits = await import("../../lib/auth/verification-rate-limit");
  const { createLoginSession } = await import("../../lib/auth/login-session");

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
  for (const [path, limit, ip] of [["forgot-password", 5, "192.0.2.41"], ["reset-password", 10, "192.0.2.42"], ["resend-verification", 5, "192.0.2.43"]] as const) {
    for (let index = 0; index < limit; index += 1) {
      const response = await proxy(new NextRequest(`https://example.test/api/auth/${path}`, { method: "POST", headers: { origin: "https://example.test", "x-vercel-forwarded-for": ip } }));
      assert.notEqual(response.status, 429);
    }
    const blocked = await proxy(new NextRequest(`https://example.test/api/auth/${path}`, { method: "POST", headers: { origin: "https://example.test", "x-vercel-forwarded-for": ip } }));
    assert.equal(blocked.status, 429);
  }

  const legacyUser = await prisma.user.findUniqueOrThrow({
    where: { email: "legacy-verification-fixture@example.test" },
    select: { id: true, emailVerifiedAt: true, password: true },
  });
  assert(legacyUser.emailVerifiedAt, "Batch B migration must backfill the pre-existing user");

  const registrationEmail = `${randomIdentifier("verification_")}@example.test`;
  const registrationPassword = "Verification-password-42";
  const originalInfoForVerification = console.info;
  console.info = () => undefined;
  let registrationResponse: Response;
  try {
    registrationResponse = await register(new Request("https://example.test/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Verification Integration", email: registrationEmail, password: registrationPassword }),
    }));
  } finally {
    console.info = originalInfoForVerification;
  }
  assert.equal(registrationResponse.status, 201);
  const registeredUser = await prisma.user.findUniqueOrThrow({ where: { email: registrationEmail }, select: { id: true, emailVerifiedAt: true } });
  assert.equal(registeredUser.emailVerifiedAt, null);
  const registrationTokens = await prisma.identityToken.findMany({ where: { userId: registeredUser.id, purpose: "EMAIL_VERIFICATION" } });
  assert.equal(registrationTokens.length, 1);
  assert.equal(registrationTokens[0].targetEmail, registrationEmail);

  const unverifiedLogin = await login(new Request("https://example.test/api/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: registrationEmail, password: registrationPassword }),
  }));
  assert.equal(unverifiedLogin.status, 403);
  assert.equal((await unverifiedLogin.json()).code, "EMAIL_VERIFICATION_REQUIRED");
  assert.equal(await prisma.session.count({ where: { userId: registeredUser.id } }), 0);

  const firstVerification = await tokens.issueEmailVerificationToken(registrationEmail);
  assert.equal(firstVerification, null, "Registration token must enforce persisted cooldown");
  await prisma.identityToken.updateMany({ where: { userId: registeredUser.id, purpose: "EMAIL_VERIFICATION" }, data: { createdAt: new Date(Date.now() - tokens.EMAIL_VERIFICATION_ISSUANCE_COOLDOWN_MS - 1_000) } });
  const supersedingVerification = await tokens.issueEmailVerificationToken(registrationEmail);
  assert(supersedingVerification);
  assert((await prisma.identityToken.findUniqueOrThrow({ where: { id: registrationTokens[0].id } })).revokedAt);
  assert.notEqual(tokens.hashIdentityToken(supersedingVerification.rawToken), supersedingVerification.rawToken);

  const unrelatedSessionHash = randomIdentifier("verification_session_");
  await prisma.session.create({ data: { userId: registeredUser.id, tokenHash: unrelatedSessionHash, expiresAt: new Date(Date.now() + 86_400_000) } });
  const company = await prisma.company.create({ data: { name: "Verification Company", country: "Test", category: "Test", status: "Active", description: "Test", email: registrationEmail, website: "", ownerId: registeredUser.id }, select: { id: true } });
  const expert = await prisma.expert.create({ data: { name: "Verification Expert", country: "Test", specialty: "Test", status: "Active", experience: "Test", email: registrationEmail, ownerId: registeredUser.id }, select: { id: true } });
  assert.equal(await tokens.verifyEmailWithToken(supersedingVerification.rawToken), "verified");
  assert((await prisma.user.findUniqueOrThrow({ where: { id: registeredUser.id }, select: { emailVerifiedAt: true } })).emailVerifiedAt);
  assert.equal(await tokens.verifyEmailWithToken(supersedingVerification.rawToken), "already-verified");
  assert.equal(await prisma.session.count({ where: { userId: registeredUser.id, tokenHash: unrelatedSessionHash } }), 1);
  assert.equal((await prisma.company.findUniqueOrThrow({ where: { id: company.id }, select: { verificationStatus: true } })).verificationStatus, "PENDING");
  assert.equal((await prisma.expert.findUniqueOrThrow({ where: { id: expert.id }, select: { verificationStatus: true } })).verificationStatus, "PENDING");

  const concurrentEmail = `${randomIdentifier("concurrent_verification_")}@example.test`;
  const concurrentUser = await prisma.user.create({ data: { name: "Concurrent Verification", email: concurrentEmail, password: oldHash, emailVerifiedAt: null }, select: { id: true } });
  const concurrentToken = await tokens.runSerializableIdentityTransaction((transaction) => tokens.createEmailVerificationToken(transaction, concurrentUser.id, concurrentEmail));
  const concurrentVerification = await Promise.all([tokens.verifyEmailWithToken(concurrentToken.rawToken), tokens.verifyEmailWithToken(concurrentToken.rawToken)]);
  assert.equal(concurrentVerification.filter((result) => result === "verified").length, 1);

  const rejectedEmail = `${randomIdentifier("rejected_verification_")}@example.test`;
  const rejectedUser = await prisma.user.create({ data: { name: "Rejected Verification", email: rejectedEmail, password: oldHash }, select: { id: true } });
  const expiredVerification = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: rejectedUser.id, purpose: "EMAIL_VERIFICATION", tokenHash: tokens.hashIdentityToken(expiredVerification), targetEmail: rejectedEmail, expiresAt: new Date(Date.now() - 1_000) } });
  assert.equal(await tokens.verifyEmailWithToken(expiredVerification), "invalid");
  const revokedVerification = tokens.generateIdentityToken();
  await prisma.identityToken.create({ data: { userId: rejectedUser.id, purpose: "EMAIL_VERIFICATION", tokenHash: tokens.hashIdentityToken(revokedVerification), targetEmail: rejectedEmail, expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date() } });
  assert.equal(await tokens.verifyEmailWithToken(revokedVerification), "invalid");

  const resendEmail = `${randomIdentifier("resend_verification_")}@example.test`;
  const resendUser = await prisma.user.create({ data: { name: "Resend Verification", email: resendEmail, password: oldHash }, select: { id: true } });
  const unknownVerificationEmail = `${randomIdentifier("unknown_verification_")}@example.test`;
  console.info = () => undefined;
  let knownResend: Response;
  let unknownResend: Response;
  try {
    knownResend = await resendVerification(new Request("https://example.test/api/auth/resend-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: resendEmail }) }));
    unknownResend = await resendVerification(new Request("https://example.test/api/auth/resend-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: unknownVerificationEmail }) }));
  } finally { console.info = originalInfoForVerification; }
  assert.equal(knownResend.status, unknownResend.status);
  assert.deepEqual(await knownResend.json(), await unknownResend.json());
  const resendRecord = await prisma.identityToken.findFirstOrThrow({ where: { userId: resendUser.id, purpose: "EMAIL_VERIFICATION" }, orderBy: { createdAt: "desc" } });
  assert.equal(resendRecord.revokedAt, null);

  const failureEmail = `${randomIdentifier("failure_verification_")}@example.test`;
  const failureUser = await prisma.user.create({ data: { name: "Failure Verification", email: failureEmail, password: oldHash }, select: { id: true } });
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "invalid-url";
  try {
    const failureResponse = await resendVerification(new Request("https://example.test/api/auth/resend-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: failureEmail }) }));
    assert.equal(failureResponse.status, 200);
  } finally { process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl; }
  assert((await prisma.identityToken.findFirstOrThrow({ where: { userId: failureUser.id, purpose: "EMAIL_VERIFICATION" }, orderBy: { createdAt: "desc" } })).revokedAt);

  const verificationBucket = verificationRateLimits.getVerificationAccountBucketForVerification(`${randomIdentifier("bucket_")}@example.test`);
  assert(!verificationBucket.includes("@"));
  const verifiedResend = await resendVerification(new Request("https://example.test/api/auth/resend-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: registrationEmail }) }));
  assert.equal(verifiedResend.status, 200);

  await createLoginSession(registeredUser.id);
  assert.equal(await prisma.session.count({ where: { userId: registeredUser.id } }), 1);
  assert(await bcrypt.compare("Legacy-password-42", legacyUser.password));
  await createLoginSession(legacyUser.id);
  assert.equal(await prisma.session.count({ where: { userId: legacyUser.id } }), 1);

  console.log("INTEGRATION TEST RESULTS: issuance, cooldown, supersession, expiry, revocation passed");
  console.log("CONCURRENCY RESULT: exactly one succeeded and one failed safely");
  console.log("PASSWORD RESULT: old rejected; new accepted");
  console.log("SESSION INVALIDATION RESULT: all sessions deleted");
  console.log("REPLAY RESULT: consumed token rejected");
  console.log("ROLLBACK RESULT: untested; no safe production failure-injection seam exists");
  console.log("RATE-LIMIT RESULT: forgot IP, account HMAC, reset IP, and token-hash buckets passed");
  console.log("EMAIL VERIFICATION RESULT: migration backfill, registration, cooldown, supersession, claim, replay, expiry, revocation, concurrency, resend parity, delivery failure, login gating, session preservation, and directory independence passed");
  await prisma.$disconnect();
}

async function main(): Promise<void> {
  if (process.argv.includes("--suite")) { await runSuite(); return; }
  assert(!process.env.TEST_DATABASE_URL, "Refusing to overwrite an existing TEST_DATABASE_URL");
  const testPort = await selectLoopbackPort();

  const containerName = randomIdentifier("dasres-recovery-");
  const databaseName = randomIdentifier(DATABASE_PREFIX);
  const username = randomIdentifier("recovery_user_");
  const password = randomBytes(32).toString("base64url");
  const testUrl = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@127.0.0.1:${testPort}/${databaseName}`;
  const envFile = await readFile(".env", "utf8").catch(() => "");
  const projectUrl = process.env.DATABASE_URL ?? parseEnvironmentValue(envFile, "DATABASE_URL");
  const parsed = assertSafeTestDatabase(testUrl, testPort, projectUrl);
  const serverOnlyShim = pathToFileURL(path.join(process.cwd(), "scripts", "integration", "server-only-register.mjs")).href;
  const childEnvironment: NodeJS.ProcessEnv = { ...process.env, TEST_DATABASE_URL: testUrl, TEST_DATABASE_PORT: String(testPort), DATABASE_URL: testUrl, PROJECT_DATABASE_URL_FOR_SAFETY: projectUrl, NEXT_PUBLIC_SITE_URL: "https://example.test", ACCOUNT_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"), TRUSTED_PROXY_MODE: "local", TRUSTED_PROXY_SECRET: randomBytes(32).toString("hex"), NODE_ENV: "test", NODE_OPTIONS: `--import=\"${serverOnlyShim}\"` };
  let started = false;
  try {
    console.log(`ISOLATION PROOF: host=${parsed.hostname} port=${parsed.port} database-prefix=${DATABASE_PREFIX} container=${containerName}`);
    console.log(`ISOLATION PROOF: TEST_DATABASE_URL differs from DATABASE_URL=${testUrl !== projectUrl}; Neon/cloud hostname=false`);
    await run("docker", ["run", "--rm", "-d", "--name", containerName, "-p", `127.0.0.1:${testPort}:5432`, "-e", `POSTGRES_DB=${databaseName}`, "-e", `POSTGRES_USER=${username}`, "-e", `POSTGRES_PASSWORD=${password}`, "postgres:16-alpine"], childEnvironment);
    started = true;
    await waitForPostgres(containerName, childEnvironment);
    const preVerificationMigrations = [
      "00000000000000_baseline",
      "20260727084433_enforce_database_integrity",
      "20260728171956_enforce_review_case_integrity",
      "20260803120000_hash_session_tokens",
      "20260803130000_private_confidential_documents",
      "20260808120000_identity_tokens",
    ];
    for (const migrationName of preVerificationMigrations) {
      await runPostgresSql(containerName, databaseName, username, await readFile(path.join("prisma", "migrations", migrationName, "migration.sql"), "utf8"), childEnvironment);
    }
    const bcrypt = await import("bcryptjs");
    const legacyHash = await bcrypt.hash("Legacy-password-42", 12);
    await runPostgresSql(containerName, databaseName, username, `INSERT INTO "User" ("name", "email", "password", "role") VALUES ('Legacy Verification Fixture', 'legacy-verification-fixture@example.test', '${legacyHash}', 'user');`, childEnvironment);
    await runPostgresSql(containerName, databaseName, username, await readFile(path.join("prisma", "migrations", "20260815120000_email_verification", "migration.sql"), "utf8"), childEnvironment);
    await runPostgresSql(containerName, databaseName, username, await readFile(path.join("prisma", "migrations", "20260815160000_secure_file_storage_foundation", "migration.sql"), "utf8"), childEnvironment);
    const alreadyApplied = new Set([...preVerificationMigrations, "20260815120000_email_verification", "20260815160000_secure_file_storage_foundation"]);
    const repositoryMigrations = (await readdir(path.join("prisma", "migrations"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !alreadyApplied.has(entry.name))
      .map((entry) => entry.name)
      .sort();
    for (const migrationName of repositoryMigrations) {
      await runPostgresSql(containerName, databaseName, username, await readFile(path.join("prisma", "migrations", migrationName, "migration.sql"), "utf8"), childEnvironment);
    }
    console.log(`MIGRATIONS APPLIED TO DISPOSABLE DB: legacy fixture sequence preserved; remaining repository migrations applied=${repositoryMigrations.join(",")}`);
    // This guarded orchestrator owns the disposable PostgreSQL lifecycle for
    // both auth integration and Secure File Storage Batch B integration.
    await run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/integration/account-recovery-postgres.ts", "--suite"], childEnvironment);
    await runFileRouteHttpSuite(childEnvironment, containerName, databaseName, username);
    await run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/integration/file-storage-domains-postgres.ts"], childEnvironment);
    await run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/integration/public-images-postgres.ts"], childEnvironment);
  } finally {
    delete process.env.TEST_DATABASE_URL;
    if (started) await execFileAsync("docker", ["stop", containerName], { env: process.env }).catch(() => undefined);
    const remaining = await execFileAsync("docker", ["ps", "-a", "--filter", `name=^/${containerName}$`, "--format", "{{.Names}}"], { env: process.env }).catch(() => ({ stdout: "unknown" }));
    assert.equal(remaining.stdout.trim(), "", "Disposable container cleanup failed");
    assert.equal(await isLoopbackPortListening(testPort), false, "Disposable database port cleanup failed");
    console.log(`CLEANUP RESULT: disposable container removed; dynamic port ${testPort} released; TEST_DATABASE_URL cleared; no volume created`);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown integration-test failure");
  process.exitCode = 1;
});
