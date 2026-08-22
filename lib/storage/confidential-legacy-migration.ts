import "server-only";

import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";

import { FILE_SECURITY_LIMITS } from "../security/file-security-limits";
import { FileSecurityError } from "../security/file-security-errors";
import { validateFileContent, type FileContentKind } from "./file-content-validation";
import type { StoredByteScanner } from "./file-scan-workflow";
import { scanStoredObject, storeWithSha256 } from "./file-scan-workflow";
import { createQuarantineObjectKey } from "./object-key";
import type { SecureObjectStorage } from "./secure-object-storage";

export type ConfidentialLegacyDomain = "case-document" | "project-attachment";
export type ConfidentialLegacyMode = "inventory" | "dry-run" | "apply" | "reconcile";
export type ConfidentialLegacyRecord = Readonly<{
  domain: ConfidentialLegacyDomain; id: number; storageKey: string; storageProvider: string; displayName: string;
  mimeType: string | null; fileSize: number | null; checksumSha256: string | null; scanStatus: string | null;
  scannedAt: Date | null; scanEngine: string | null; scanAttempts: number;
}>;
export type ConfidentialLegacyFinalization = Readonly<{
  storageKey: string; storageProvider: "r2"; mimeType: string; fileSize: number; checksumSha256: string;
  scanStatus: "CLEAN"; scannedAt: Date; scanEngine: "clamav"; scanAttempts: 1;
}>;
export interface ConfidentialLegacyRepository {
  list(): Promise<readonly ConfidentialLegacyRecord[]>;
  finalize(expected: ConfidentialLegacyRecord, finalized: ConfidentialLegacyFinalization): Promise<boolean>;
}
export type ConfidentialLegacyOutcome = "already_migrated" | "valid_source" | "missing_source" | "invalid_path" |
  "unsupported_file" | "ambiguous_metadata" | "would_migrate" | "migrated" | "infected" | "scanner_failure" |
  "storage_failure" | "integrity_mismatch" | "conditional_conflict" | "missing_object" | "metadata_mismatch" | "clean_r2";
export type ConfidentialLegacyReport = Readonly<{
  mode: ConfidentialLegacyMode;
  items: readonly Readonly<{ domain: ConfidentialLegacyDomain; id: number; outcome: ConfidentialLegacyOutcome }>[];
  totals: Readonly<Record<ConfidentialLegacyOutcome, number>>;
  orphanDetection: "not-safely-attributable";
}>;
export type ConfidentialLegacyDependencies = Readonly<{
  repository: ConfidentialLegacyRepository; storage: SecureObjectStorage; scanner: StoredByteScanner; legacyRoot: string;
}>;

const MIME_POLICY: Readonly<Record<string, { mime: string; kind: FileContentKind }>> = {
  ".pdf": { mime: "application/pdf", kind: "pdf" },
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "docx" },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "xlsx" },
  ".jpg": { mime: "image/jpeg", kind: "jpeg" }, ".jpeg": { mime: "image/jpeg", kind: "jpeg" },
  ".png": { mime: "image/png", kind: "png" }, ".webp": { mime: "image/webp", kind: "webp" },
};
const OUTCOMES: readonly ConfidentialLegacyOutcome[] = ["already_migrated", "valid_source", "missing_source", "invalid_path",
  "unsupported_file", "ambiguous_metadata", "would_migrate", "migrated", "infected", "scanner_failure", "storage_failure",
  "integrity_mismatch", "conditional_conflict", "missing_object", "metadata_mismatch", "clean_r2"];

function isMigrated(record: ConfidentialLegacyRecord): boolean { return record.storageProvider === "r2" && record.scanStatus === "CLEAN"; }
function isAmbiguous(record: ConfidentialLegacyRecord): boolean {
  return record.storageProvider !== "local" || Boolean(record.checksumSha256 || record.scannedAt || record.scanEngine || record.scanAttempts || record.scanStatus);
}
function legacyFileName(record: ConfidentialLegacyRecord): string {
  const prefix = record.domain === "case-document" ? "/uploads/cases/" : "/uploads/project-task-attachments/";
  let value: string;
  try { value = record.storageKey.startsWith(prefix) ? decodeURIComponent(record.storageKey.slice(prefix.length)) : record.storageKey; }
  catch { throw new Error("invalid_path"); }
  if (!value || value.includes("\0") || path.isAbsolute(value) || path.win32.isAbsolute(value) || path.posix.isAbsolute(value) ||
      path.basename(value) !== value || value === "." || value === "..") throw new Error("invalid_path");
  return value;
}
async function loadSource(record: ConfidentialLegacyRecord, root: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const fileName = legacyFileName(record);
  const policy = MIME_POLICY[path.extname(fileName).toLowerCase()];
  if (!policy) throw new Error("unsupported_file");
  const domainRoot = path.resolve(root, record.domain === "case-document" ? "cases" : "project-task-attachments");
  const candidate = path.resolve(domainRoot, fileName);
  if (path.dirname(candidate) !== domainRoot) throw new Error("invalid_path");
  let handle: Awaited<ReturnType<typeof open>>;
  try { handle = await open(candidate, "r"); } catch { throw new Error("missing_source"); }
  let bytes: Buffer;
  try {
    const [resolvedRoot, resolvedCandidate, pathMetadata, handleMetadata] = await Promise.all([
      realpath(domainRoot), realpath(candidate), lstat(candidate), handle.stat(),
    ]);
    if (path.dirname(resolvedCandidate) !== resolvedRoot || pathMetadata.isSymbolicLink() || !pathMetadata.isFile() ||
        !handleMetadata.isFile() || pathMetadata.dev !== handleMetadata.dev || pathMetadata.ino !== handleMetadata.ino || handleMetadata.size <= 0) {
      throw new Error("invalid_path");
    }
    if (handleMetadata.size > FILE_SECURITY_LIMITS.confidentialDocumentBytes) throw new Error("unsupported_file");
    bytes = await handle.readFile();
    const afterRead = await handle.stat();
    if (bytes.length !== handleMetadata.size || afterRead.size !== handleMetadata.size || afterRead.mtimeMs !== handleMetadata.mtimeMs) {
      throw new Error("integrity_mismatch");
    }
  } finally { await handle.close(); }
  await validateFileContent({ kind: policy.kind, fileName, mimeType: policy.mime, bytes });
  return { bytes, mimeType: policy.mime };
}
function body(bytes: Buffer): AsyncIterable<Uint8Array> { return (async function* () { yield bytes; })(); }
function errorOutcome(error: unknown): ConfidentialLegacyOutcome {
  if (error instanceof FileSecurityError) {
    if (error.category === "infected" || error.category === "suspicious") return "infected";
    if (error.category.startsWith("scanner")) return "scanner_failure";
    if (error.category === "integrity_mismatch") return "integrity_mismatch";
    return "storage_failure";
  }
  const text = error instanceof Error ? error.message : "";
  if (text.includes("infected") || text.includes("suspicious")) return "infected";
  if (text.includes("scanner")) return "scanner_failure";
  if (text.includes("integrity")) return "integrity_mismatch";
  if (text === "missing_source") return "missing_source";
  if (text === "invalid_path") return "invalid_path";
  if (text === "unsupported_file") return "unsupported_file";
  return "storage_failure";
}
async function inspect(record: ConfidentialLegacyRecord, mode: ConfidentialLegacyMode, dependencies: ConfidentialLegacyDependencies): Promise<ConfidentialLegacyOutcome> {
  if (isMigrated(record)) {
    if (mode !== "reconcile") return "already_migrated";
    try { return (await dependencies.storage.head(record.storageKey)).size === record.fileSize ? "clean_r2" : "metadata_mismatch"; }
    catch { return "missing_object"; }
  }
  if (isAmbiguous(record)) return "ambiguous_metadata";
  if (mode === "reconcile") return "valid_source";
  let source: Awaited<ReturnType<typeof loadSource>>;
  try { source = await loadSource(record, dependencies.legacyRoot); } catch (error) { return errorOutcome(error); }
  if (mode === "inventory") return "valid_source";
  if (mode === "dry-run") return "would_migrate";
  const storageKey = createQuarantineObjectKey(record.domain); let created = false;
  try {
    const written = await storeWithSha256(dependencies.storage, storageKey, body(source.bytes), source.mimeType); created = true;
    const scanned = await scanStoredObject({ storage: dependencies.storage, scanner: dependencies.scanner, key: storageKey,
      expectedSize: written.size, expectedChecksumSha256: written.checksumSha256 });
    const finalized = await dependencies.repository.finalize(record, { storageKey, storageProvider: "r2", mimeType: source.mimeType,
      fileSize: scanned.size, checksumSha256: scanned.checksumSha256, scanStatus: "CLEAN", scannedAt: new Date(), scanEngine: "clamav", scanAttempts: 1 });
    if (!finalized) { await dependencies.storage.remove(storageKey).catch(() => undefined); return "conditional_conflict"; }
    return "migrated";
  } catch (error) { if (created) await dependencies.storage.remove(storageKey).catch(() => undefined); return errorOutcome(error); }
}
export async function runConfidentialLegacyMigration(mode: ConfidentialLegacyMode, dependencies: ConfidentialLegacyDependencies): Promise<ConfidentialLegacyReport> {
  const items = [] as Array<{ domain: ConfidentialLegacyDomain; id: number; outcome: ConfidentialLegacyOutcome }>;
  for (const record of await dependencies.repository.list()) items.push({ domain: record.domain, id: record.id, outcome: await inspect(record, mode, dependencies) });
  const totals = Object.fromEntries(OUTCOMES.map((outcome) => [outcome, items.filter((item) => item.outcome === outcome).length])) as Record<ConfidentialLegacyOutcome, number>;
  return { mode, items, totals, orphanDetection: "not-safely-attributable" };
}
