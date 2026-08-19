import "server-only";

import path from "node:path";
import { lstat, readFile, realpath } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { prisma } from "../lib/prisma";
import {
  createPublicImageUrl,
  normalizePublicImage,
  removePublicImageBestEffort,
  storePublicImage,
  type PublicImageDomain,
  type PublicImageKind,
  type PublicImageDependencies,
} from "../lib/storage/public-image-storage";

const DOMAIN_CONFIG = {
  company: { prefix: "/uploads/companies/", root: "companies", kind: "company-logo" },
  expert: { prefix: "/uploads/experts/", root: "experts", kind: "expert-image" },
  opportunity: { prefix: "/uploads/opportunities/", root: "opportunities", kind: "opportunity-image" },
} as const satisfies Record<PublicImageDomain, { prefix: string; root: string; kind: PublicImageKind }>;

const MIME_BY_EXTENSION: Readonly<Record<string, "image/jpeg" | "image/png" | "image/webp">> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

function argumentsValue(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function selectedDomain(): PublicImageDomain {
  const value = argumentsValue("domain");
  if (value === "company" || value === "expert" || value === "opportunity") return value;
  throw new Error("Specify exactly one --domain=company|expert|opportunity");
}

const CLOUD_HOST_PATTERNS = ["neon.tech", "neon.build", "supabase.co", "render.com", "railway.app", "amazonaws.com", "azure.com", "cloud.google.com", "pooler"];

export function resolveBackfillDatabaseUrl(environment: Readonly<Record<string, string | undefined>>, argumentsList: readonly string[]): string {
  const production = argumentsList.includes("--production");
  const apply = argumentsList.includes("--apply");
  if (production) {
    if (!apply || !argumentsList.includes("--acknowledge-production")) {
      throw new Error("Production mode requires --apply and --acknowledge-production");
    }
    const productionUrl = environment.DATABASE_URL;
    if (!productionUrl) throw new Error("DATABASE_URL is required for acknowledged production mode");
    return productionUrl;
  }

  const testUrl = environment.TEST_DATABASE_URL;
  if (!testUrl) throw new Error("TEST_DATABASE_URL is required");
  if (environment.DATABASE_URL && testUrl === environment.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  }
  const parsed = new URL(testUrl);
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "postgresql:" || !["127.0.0.1", "localhost", "::1"].includes(hostname)) {
    throw new Error("TEST_DATABASE_URL must use disposable loopback PostgreSQL");
  }
  if (CLOUD_HOST_PATTERNS.some((pattern) => hostname.includes(pattern))) {
    throw new Error("Cloud database hosts are forbidden for backfill tests");
  }
  return testUrl;
}

export async function readLegacyPublicImage(domain: PublicImageDomain, url: string): Promise<File> {
  const config = DOMAIN_CONFIG[domain];
  if (!url.startsWith(config.prefix)) throw new Error("not_local_legacy");
  const fileName = url.slice(config.prefix.length);
  if (!fileName || path.basename(fileName) !== fileName || fileName.includes("..")) throw new Error("unsafe_legacy_path");
  const mimeType = MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()];
  if (!mimeType) throw new Error("unsupported_legacy_extension");

  const root = path.resolve(process.cwd(), "public", "uploads", config.root);
  const candidate = path.resolve(root, fileName);
  if (!candidate.startsWith(`${root}${path.sep}`)) throw new Error("outside_legacy_root");
  const metadata = await lstat(candidate);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error("unsafe_legacy_file");
  const [resolvedRoot, resolvedCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
  if (!resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("outside_legacy_root");
  const bytes = await readFile(resolvedCandidate);
  return new File([new Uint8Array(bytes)], fileName, { type: mimeType });
}

export async function migratePublicImageRecord(
  domain: PublicImageDomain,
  id: number,
  url: string,
  apply: boolean,
  dependencies?: PublicImageDependencies,
): Promise<void> {
  const file = await readLegacyPublicImage(domain, url);
  if (!apply) {
    await normalizePublicImage(file);
    console.log(JSON.stringify({ domain, id, outcome: "valid_dry_run" }));
    return;
  }

  const stored = await storePublicImage({ file, kind: DOMAIN_CONFIG[domain].kind, dependencies });
  let finalized = false;
  try {
    const common = {
      imageUrl: createPublicImageUrl(domain, id),
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      checksumSha256: stored.checksumSha256,
      scanStatus: stored.scanStatus,
      scannedAt: stored.scannedAt,
      scanEngine: stored.scanEngine,
      scanAttempts: stored.scanAttempts,
    };
    const result = domain === "company"
      ? await prisma.company.updateMany({ where: { id, logoUrl: url, logoStorageKey: null }, data: {
          logoUrl: common.imageUrl, logoStorageKey: common.storageKey, logoStorageProvider: common.storageProvider,
          logoMimeType: common.mimeType, logoFileSize: common.fileSize, logoChecksumSha256: common.checksumSha256,
          logoScanStatus: common.scanStatus, logoScannedAt: common.scannedAt, logoScanEngine: common.scanEngine,
          logoScanAttempts: common.scanAttempts,
        } })
      : domain === "expert"
        ? await prisma.expert.updateMany({ where: { id, imageUrl: url, imageStorageKey: null }, data: {
            imageUrl: common.imageUrl, imageStorageKey: common.storageKey, imageStorageProvider: common.storageProvider,
            imageMimeType: common.mimeType, imageFileSize: common.fileSize, imageChecksumSha256: common.checksumSha256,
            imageScanStatus: common.scanStatus, imageScannedAt: common.scannedAt, imageScanEngine: common.scanEngine,
            imageScanAttempts: common.scanAttempts,
          } })
        : await prisma.opportunity.updateMany({ where: { id, imageUrl: url, imageStorageKey: null }, data: {
            imageUrl: common.imageUrl, imageStorageKey: common.storageKey, imageStorageProvider: common.storageProvider,
            imageMimeType: common.mimeType, imageFileSize: common.fileSize, imageChecksumSha256: common.checksumSha256,
            imageScanStatus: common.scanStatus, imageScannedAt: common.scannedAt, imageScanEngine: common.scanEngine,
            imageScanAttempts: common.scanAttempts,
          } });
    if (result.count !== 1) throw new Error("conditional_finalize_conflict");
    finalized = true;
    console.log(JSON.stringify({ domain, id, outcome: "migrated" }));
  } finally {
    if (!finalized) await removePublicImageBestEffort(stored.storageKey, dependencies?.storage);
  }
}

async function main(): Promise<void> {
  const domain = selectedDomain();
  const apply = process.argv.includes("--apply");
  process.env.DATABASE_URL = resolveBackfillDatabaseUrl(process.env, process.argv);
  const records = domain === "company"
    ? await prisma.company.findMany({ where: { logoStorageKey: null, logoUrl: { startsWith: DOMAIN_CONFIG.company.prefix } }, select: { id: true, logoUrl: true }, orderBy: { id: "asc" } })
    : domain === "expert"
      ? await prisma.expert.findMany({ where: { imageStorageKey: null, imageUrl: { startsWith: DOMAIN_CONFIG.expert.prefix } }, select: { id: true, imageUrl: true }, orderBy: { id: "asc" } })
      : await prisma.opportunity.findMany({ where: { imageStorageKey: null, imageUrl: { startsWith: DOMAIN_CONFIG.opportunity.prefix } }, select: { id: true, imageUrl: true }, orderBy: { id: "asc" } });

  for (const record of records) {
    const url = "logoUrl" in record ? record.logoUrl : record.imageUrl;
    if (!url) continue;
    try { await migratePublicImageRecord(domain, record.id, url, apply); }
    catch (error) { console.error(JSON.stringify({ domain, id: record.id, outcome: "failed", error: error instanceof Error ? error.message : "unknown" })); }
  }
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entrypoint === import.meta.url) {
  main().finally(() => prisma.$disconnect()).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Public image migration failed");
    process.exitCode = 1;
  });
}
