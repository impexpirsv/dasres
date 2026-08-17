import "server-only";
import path from "node:path";
import { lstat } from "node:fs/promises";
import { AppError } from "../errors";
import { ClamAvUploadScanner } from "../security/clamav-upload-scanner";
import { FILE_SECURITY_LIMITS } from "../security/file-security-limits";
import { parseBoundedMultipartUpload } from "../security/upload-request";
import { validateFileContent, type FileContentKind } from "./file-content-validation";
import { scanStoredObject, storeWithSha256, type StoredByteScanner } from "./file-scan-workflow";
import { createQuarantineObjectKey, type StorageObjectKind } from "./object-key";
import { R2StorageProvider } from "./r2-storage-provider";
import type { SecureObjectStorage, StoredObject } from "./secure-object-storage";
import { LocalStorageProvider } from "./storage-provider";

const MIME_KIND: Readonly<Record<string, FileContentKind>> = {
  "application/pdf": "pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx", "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp",
};
export type SecureUploadedFile = Readonly<{ storageKey: string; storageProvider: "r2"; originalFileName: string;
  mimeType: string; fileSize: number; checksumSha256: string; scanStatus: "CLEAN"; scannedAt: Date; scanEngine: "clamav"; scanAttempts: 1 }>;
export type ConfidentialFileDependencies = Readonly<{ storage: SecureObjectStorage; scanner: StoredByteScanner }>;
function dependencies(): ConfidentialFileDependencies { return { storage: new R2StorageProvider(), scanner: new ClamAvUploadScanner() }; }
function displayName(value: string): string {
  const name = path.basename(value).normalize("NFKC").trim();
  if (!name || name === "." || name === ".." || name.length > 255 || /[\u0000-\u001f\u007f]/.test(name)) throw new AppError("INVALID_FILE_NAME", 400);
  return name;
}
function body(bytes: Buffer): AsyncIterable<Uint8Array> { return (async function* () { yield bytes; })(); }
export async function storeConfidentialUpload(input: { request: Request; kind: Extract<StorageObjectKind, "case-document" | "project-attachment">; dependencies?: ConfidentialFileDependencies }): Promise<SecureUploadedFile> {
  const upload = await parseBoundedMultipartUpload(input.request, { maximumRequestBytes: 11 * 1024 * 1024, maximumFileBytes: 10 * 1024 * 1024 });
  if (Object.keys(upload.fields).length !== 0 || upload.file.bytes.length === 0) throw new AppError("INVALID_UPLOAD", 400);
  const originalFileName = displayName(upload.file.fileName); const mimeType = upload.file.mimeType.trim().toLowerCase(); const kind = MIME_KIND[mimeType];
  if (!kind) throw new AppError("UNSUPPORTED_FILE_TYPE", 415);
  await validateFileContent({ kind, fileName: originalFileName, mimeType, bytes: upload.file.bytes });
  const active = input.dependencies ?? dependencies(); const storageKey = createQuarantineObjectKey(input.kind); let stored = false;
  try {
    const written = await storeWithSha256(active.storage, storageKey, body(upload.file.bytes), mimeType); stored = true;
    const scanned = await scanStoredObject({ storage: active.storage, scanner: active.scanner, key: storageKey, expectedSize: written.size, expectedChecksumSha256: written.checksumSha256 });
    return { storageKey, storageProvider: "r2", originalFileName, mimeType, fileSize: scanned.size, checksumSha256: scanned.checksumSha256,
      scanStatus: "CLEAN", scannedAt: new Date(), scanEngine: "clamav", scanAttempts: 1 };
  } catch (error) { if (stored) await active.storage.remove(storageKey).catch(() => undefined); throw error; }
}
export async function getSecureObject(key: string, injected?: SecureObjectStorage): Promise<StoredObject> { return (injected ?? new R2StorageProvider()).get(key); }
export async function removeSecureObject(key: string, injected?: SecureObjectStorage): Promise<void> { await (injected ?? new R2StorageProvider()).remove(key); }
export async function readLegacyPrivateFile(input: { root: string; storageKey: string }): Promise<{ bytes: Buffer; size: number }> {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(input.storageKey)) throw new AppError("FILE_NOT_FOUND", 404);
  const provider = new LocalStorageProvider(path.join(process.cwd(), "storage", "private", input.root));
  try { if ((await lstat(provider.resolve(input.storageKey))).isSymbolicLink()) throw new Error("symbolic link"); return await provider.read(input.storageKey); }
  catch { throw new AppError("FILE_NOT_FOUND", 404); }
}
export async function removeLegacyPrivateFile(input: { root: string; storageKey: string }): Promise<void> {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(input.storageKey)) throw new AppError("FILE_NOT_FOUND", 404);
  await new LocalStorageProvider(path.join(process.cwd(), "storage", "private", input.root)).remove(input.storageKey);
}
export function streamBoundedObject(object: StoredObject): ReadableStream<Uint8Array> {
  if (object.size > FILE_SECURITY_LIMITS.scannerStreamBytes) throw new AppError("FILE_NOT_FOUND", 404);
  const iterator = object.body[Symbol.asyncIterator]();
  let size = 0;
  let settled = false;
  const closeSource = async (): Promise<void> => {
    if (settled) return;
    settled = true;
    await iterator.return?.();
  };
  // Provider failures or length mismatches discovered after the response is
  // committed surface as a failed response body; they cannot be remapped to a
  // JSON status at that point. The source is still closed deterministically.
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) {
          settled = true;
          if (size !== object.size) controller.error(new AppError("FILE_NOT_FOUND", 404));
          else controller.close();
          return;
        }
        const chunk = Buffer.from(next.value);
        size += chunk.byteLength;
        if (size > object.size || size > FILE_SECURITY_LIMITS.scannerStreamBytes) {
          await closeSource();
          controller.error(new AppError("FILE_NOT_FOUND", 404));
          return;
        }
        controller.enqueue(chunk);
      } catch (error) {
        await closeSource().catch(() => undefined);
        controller.error(error);
      }
    },
    async cancel() { await closeSource(); },
  });
}
