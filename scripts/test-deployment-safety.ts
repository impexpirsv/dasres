import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { GET as live } from "../app/api/health/live/route";
import { DeterministicStoredByteScanner } from "../lib/storage/file-scan-workflow";
import { InMemorySecureObjectStorage } from "../lib/storage/secure-object-storage";
import { runConfidentialLegacyMigration, type ConfidentialLegacyFinalization, type ConfidentialLegacyRecord,
  type ConfidentialLegacyRepository } from "../lib/storage/confidential-legacy-migration";
import { getTrustedClientIdentifier, normalizeClientIp, UNIDENTIFIED_CLIENT } from "../lib/security/trusted-client-ip";
import { resolveConfidentialMigrationDatabaseUrl } from "./migrate-confidential-files";
import { assertDisposableSeedTarget } from "../prisma/seed";

async function main(): Promise<void> {
process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:1/disposable";
const { isApplicationReady } = await import("../lib/health/readiness");
const SECRET = "p".repeat(48);
const localEnvironment = { NODE_ENV: "production", TRUSTED_PROXY_MODE: "local", TRUSTED_PROXY_SECRET: SECRET };
function trustedHeaders(ip: string): Headers { return new Headers({ "x-dasres-client-ip": ip, "x-dasres-proxy-secret": SECRET }); }

assert.equal(getTrustedClientIdentifier(new Headers({ "x-forwarded-for": "203.0.113.1", "x-real-ip": "203.0.113.2",
  "x-vercel-forwarded-for": "203.0.113.3", "cf-connecting-ip": "203.0.113.4" }), { NODE_ENV: "test" }), UNIDENTIFIED_CLIENT);
assert.equal(getTrustedClientIdentifier(trustedHeaders("203.0.113.10"), localEnvironment), "203.0.113.10");
assert.equal(getTrustedClientIdentifier(trustedHeaders("2001:DB8::1"), localEnvironment), "2001:db8::1");
assert.equal(getTrustedClientIdentifier(trustedHeaders("203.0.113.10, 10.0.0.1"), localEnvironment), UNIDENTIFIED_CLIENT);
assert.equal(getTrustedClientIdentifier(trustedHeaders("not-an-ip"), localEnvironment), UNIDENTIFIED_CLIENT);
assert.equal(getTrustedClientIdentifier(new Headers({ "x-dasres-client-ip": "203.0.113.10" }), localEnvironment), UNIDENTIFIED_CLIENT);
assert.notEqual(getTrustedClientIdentifier(trustedHeaders("203.0.113.10"), localEnvironment),
  getTrustedClientIdentifier(trustedHeaders("203.0.113.11"), localEnvironment));
assert.equal(normalizeClientIp("::ffff:192.0.2.8"), "192.0.2.8");
assert.throws(() => getTrustedClientIdentifier(new Headers(), { NODE_ENV: "production" }), /Invalid trusted proxy/);
assert.throws(() => getTrustedClientIdentifier(new Headers(), { NODE_ENV: "production", TRUSTED_PROXY_MODE: "local", TRUSTED_PROXY_SECRET: "short" }), /Invalid trusted proxy/);

const liveResponse = live();
assert.equal(liveResponse.status, 200); assert.deepEqual(await liveResponse.json(), { status: "ok" });
assert.equal(await isApplicationReady({ validateConfiguration() {}, async checkDatabase() {} }), true);
assert.equal(await isApplicationReady({ validateConfiguration() {}, async checkDatabase() { throw new Error("db"); } }), false);
assert.equal(await isApplicationReady({ validateConfiguration() { throw new Error("config"); }, async checkDatabase() {} }), false);
assert.equal(await isApplicationReady({ validateConfiguration() {}, async checkDatabase() { await new Promise(() => undefined); }, timeoutMs: 5 }), false);

assert.throws(() => resolveConfidentialMigrationDatabaseUrl({}, []), /TEST_DATABASE_URL/);
assert.throws(() => resolveConfidentialMigrationDatabaseUrl({ TEST_DATABASE_URL: "postgresql://u:p@db.example/db" }, []), /loopback/);
assert.throws(() => resolveConfidentialMigrationDatabaseUrl({ TEST_DATABASE_URL: "postgresql://u:p@127.0.0.1/db", DATABASE_URL: "postgresql://u:p@127.0.0.1/db" }, []), /must differ/);
assert.equal(resolveConfidentialMigrationDatabaseUrl({ TEST_DATABASE_URL: "postgresql://u:p@127.0.0.1/db", DATABASE_URL: "postgresql://u:p@remote.example/db" }, []), "postgresql://u:p@127.0.0.1/db");
assert.throws(() => resolveConfidentialMigrationDatabaseUrl({ DATABASE_URL: "postgresql://u:p@remote.example/db" }, ["--production", "--apply"]), /acknowledge/);
assert.throws(() => resolveConfidentialMigrationDatabaseUrl({ DATABASE_URL: "postgresql://u:p@remote.example/db" }, ["--production", "--inventory"]), /read-only/);
assert.equal(resolveConfidentialMigrationDatabaseUrl({ DATABASE_URL: "postgresql://u:p@remote.example/db" }, ["--production", "--inventory", "--acknowledge-production-read-only"]), "postgresql://u:p@remote.example/db");
assert.throws(() => assertDisposableSeedTarget({ NODE_ENV: "production", DATABASE_URL: "postgresql://u:p@127.0.0.1/db", SEED_ALLOW_DISPOSABLE_LOOPBACK: "1" }), /forbidden/);
assert.throws(() => assertDisposableSeedTarget({ DATABASE_URL: "postgresql://u:p@remote.example/db", SEED_ALLOW_DISPOSABLE_LOOPBACK: "1" }), /loopback/);
assert.doesNotThrow(() => assertDisposableSeedTarget({ NODE_ENV: "test", DATABASE_URL: "postgresql://u:p@127.0.0.1/db", SEED_ALLOW_DISPOSABLE_LOOPBACK: "1" }));

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dasres-deployment-a-"));
try {
  await mkdir(path.join(temporaryRoot, "cases")); await mkdir(path.join(temporaryRoot, "project-task-attachments"));
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
  await writeFile(path.join(temporaryRoot, "cases", "case.pdf"), pdf);
  await writeFile(path.join(temporaryRoot, "project-task-attachments", "task.pdf"), pdf);

  const base = (domain: "case-document" | "project-attachment", id: number, storageKey: string): ConfidentialLegacyRecord => ({
    domain, id, storageKey, storageProvider: "local", displayName: storageKey, mimeType: null, fileSize: null,
    checksumSha256: null, scanStatus: null, scannedAt: null, scanEngine: null, scanAttempts: 0,
  });
  class Repository implements ConfidentialLegacyRepository {
    readonly finalized: Array<Readonly<{ expected: ConfidentialLegacyRecord; value: ConfidentialLegacyFinalization }>> = [];
    constructor(readonly records: ConfidentialLegacyRecord[], readonly result = true, readonly fail = false) {}
    async list() { return this.records; }
    async finalize(expected: ConfidentialLegacyRecord, value: ConfidentialLegacyFinalization) {
      if (this.fail) throw new Error("database failure");
      this.finalized.push({ expected, value });
      if (this.result) Object.assign(this.records.find((item) => item.id === expected.id && item.domain === expected.domain)!, value);
      return this.result;
    }
  }
  const records = [base("case-document", 1, "case.pdf"), base("project-attachment", 2, "task.pdf")];
  const repository = new Repository(records); const storage = new InMemorySecureObjectStorage();
  const dependencies = { repository, storage, scanner: new DeterministicStoredByteScanner(), legacyRoot: temporaryRoot };
  const inventory = await runConfidentialLegacyMigration("inventory", dependencies);
  assert.equal(inventory.totals.valid_source, 2); assert.equal(repository.finalized.length, 0);
  const dryRun = await runConfidentialLegacyMigration("dry-run", dependencies);
  assert.equal(dryRun.totals.would_migrate, 2); assert.equal(repository.finalized.length, 0);
  const applied = await runConfidentialLegacyMigration("apply", dependencies);
  assert.equal(applied.totals.migrated, 2); assert.equal(repository.finalized.length, 2);
  for (const finalized of repository.finalized) {
    assert.equal(finalized.value.scanStatus, "CLEAN"); assert.equal(finalized.value.scanEngine, "clamav");
    assert.equal(finalized.value.fileSize, pdf.length); assert.equal((await storage.head(finalized.value.storageKey)).size, pdf.length);
  }
  assert.deepEqual(await readFile(path.join(temporaryRoot, "cases", "case.pdf")), pdf);
  assert.equal((await runConfidentialLegacyMigration("apply", dependencies)).totals.already_migrated, 2);
  assert.equal((await runConfidentialLegacyMigration("reconcile", dependencies)).totals.clean_r2, 2);

  const infected = await runConfidentialLegacyMigration("apply", { ...dependencies, repository: new Repository([base("case-document", 3, "case.pdf")]),
    storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("INFECTED") });
  assert.equal(infected.totals.infected, 1);
  const scannerFailure = await runConfidentialLegacyMigration("apply", { ...dependencies, repository: new Repository([base("case-document", 4, "case.pdf")]),
    storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("ERROR") });
  assert.equal(scannerFailure.totals.scanner_failure, 1);
  const conflictStorage = new InMemorySecureObjectStorage();
  const conflict = await runConfidentialLegacyMigration("apply", { ...dependencies, repository: new Repository([base("case-document", 5, "case.pdf")], false), storage: conflictStorage });
  assert.equal(conflict.totals.conditional_conflict, 1);
  const missing = await runConfidentialLegacyMigration("inventory", { ...dependencies, repository: new Repository([base("case-document", 6, "missing.pdf")]) });
  assert.equal(missing.totals.missing_source, 1);
  for (const invalid of ["../case.pdf", "C:\\outside.pdf", "/outside.pdf"]) {
    const report = await runConfidentialLegacyMigration("inventory", { ...dependencies, repository: new Repository([base("case-document", 7, invalid)]) });
    assert.equal(report.totals.invalid_path, 1);
  }
  try {
    await symlink(path.join(temporaryRoot, "cases", "case.pdf"), path.join(temporaryRoot, "cases", "link.pdf"));
    const linked = await runConfidentialLegacyMigration("inventory", { ...dependencies, repository: new Repository([base("case-document", 8, "link.pdf")]) });
    assert.equal(linked.totals.invalid_path, 1);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "EPERM") throw error;
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log("Deployment A runtime safety tests passed.");
}

main().catch((error: unknown) => { throw error; });
