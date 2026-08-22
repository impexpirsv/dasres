import "server-only";

import path from "node:path";
import { pathToFileURL } from "node:url";
import type { FileScanStatus, PrismaClient } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { ClamAvUploadScanner } from "../lib/security/clamav-upload-scanner";
import { runConfidentialLegacyMigration, type ConfidentialLegacyFinalization, type ConfidentialLegacyMode,
  type ConfidentialLegacyRecord, type ConfidentialLegacyRepository } from "../lib/storage/confidential-legacy-migration";
import { R2StorageProvider } from "../lib/storage/r2-storage-provider";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const CLOUD_HOST_PATTERNS = ["neon.tech", "neon.build", "supabase.co", "render.com", "railway.app", "amazonaws.com", "azure.com", "cloud.google.com", "pooler"];

export function resolveConfidentialMigrationDatabaseUrl(environment: Readonly<Record<string, string | undefined>>, argumentsList: readonly string[]): string {
  const production = argumentsList.includes("--production"); const apply = argumentsList.includes("--apply");
  if (production) {
    if (apply && !argumentsList.includes("--acknowledge-production")) throw new Error("Production apply requires --production --apply --acknowledge-production");
    if (!apply && !argumentsList.includes("--acknowledge-production-read-only")) throw new Error("Production report mode requires --production --acknowledge-production-read-only");
    if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required for production apply");
    return environment.DATABASE_URL;
  }
  if (apply && argumentsList.includes("--acknowledge-production")) throw new Error("Production acknowledgement cannot be used without --production");
  const testUrl = environment.TEST_DATABASE_URL;
  if (!testUrl) throw new Error("TEST_DATABASE_URL is required");
  if (testUrl === environment.DATABASE_URL) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  const parsed = new URL(testUrl); const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "postgresql:" || !LOOPBACK_HOSTS.has(host) || CLOUD_HOST_PATTERNS.some((item) => host.includes(item))) {
    throw new Error("TEST_DATABASE_URL must use disposable loopback PostgreSQL");
  }
  return testUrl;
}

export function parseConfidentialMigrationMode(argumentsList: readonly string[]): ConfidentialLegacyMode {
  const modes: ConfidentialLegacyMode[] = [];
  if (argumentsList.includes("--inventory")) modes.push("inventory");
  if (argumentsList.includes("--dry-run")) modes.push("dry-run");
  if (argumentsList.includes("--apply")) modes.push("apply");
  if (argumentsList.includes("--reconcile")) modes.push("reconcile");
  if (modes.length > 1) throw new Error("Specify only one migration mode");
  return modes[0] ?? "inventory";
}

function matches(record: ConfidentialLegacyRecord) {
  return { id: record.id, storageKey: record.storageKey, storageProvider: record.storageProvider, mimeType: record.mimeType,
    fileSize: record.fileSize, checksumSha256: record.checksumSha256, scanStatus: record.scanStatus as FileScanStatus | null,
    scannedAt: record.scannedAt, scanEngine: record.scanEngine, scanAttempts: record.scanAttempts };
}

export function createConfidentialLegacyRepository(client: PrismaClient): ConfidentialLegacyRepository {
  return {
    async list() {
      const [documents, attachments] = await Promise.all([
        client.caseDocument.findMany({ orderBy: { id: "asc" } }), client.projectTaskAttachment.findMany({ orderBy: { id: "asc" } }),
      ]);
      return [...documents.map((item) => ({ ...item, domain: "case-document" as const, displayName: item.name })),
        ...attachments.map((item) => ({ ...item, domain: "project-attachment" as const, displayName: item.fileName }))];
    },
    async finalize(expected, finalized: ConfidentialLegacyFinalization) {
      const result = expected.domain === "case-document"
        ? await client.caseDocument.updateMany({ where: matches(expected), data: finalized })
        : await client.projectTaskAttachment.updateMany({ where: matches(expected), data: finalized });
      return result.count === 1;
    },
  };
}

async function main(): Promise<void> {
  const mode = parseConfidentialMigrationMode(process.argv);
  process.env.DATABASE_URL = resolveConfidentialMigrationDatabaseUrl(process.env, process.argv);
  const root = process.env.CONFIDENTIAL_LEGACY_ROOT?.trim();
  if (!root || !path.isAbsolute(root)) throw new Error("CONFIDENTIAL_LEGACY_ROOT must be an absolute path");
  const report = await runConfidentialLegacyMigration(mode, { repository: createConfidentialLegacyRepository(prisma), storage: new R2StorageProvider(),
    scanner: new ClamAvUploadScanner(), legacyRoot: root });
  console.log(JSON.stringify(report));
  const accepted = new Set(["already_migrated", "valid_source", "would_migrate", "migrated", "clean_r2"]);
  if (report.items.some((item) => !accepted.has(item.outcome))) process.exitCode = 1;
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entrypoint === import.meta.url) main().finally(() => prisma.$disconnect()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Confidential migration failed"); process.exitCode = 1;
});
