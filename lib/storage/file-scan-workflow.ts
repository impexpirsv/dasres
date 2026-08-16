import "server-only";
import { createHash } from "node:crypto";
import { FileSecurityError } from "../security/file-security-errors";
import type { UploadScanResult } from "../security/upload-scanner";
import type { ObjectBody, SecureObjectStorage } from "./secure-object-storage";

export interface StoredByteScanner { scanStream(body: ObjectBody): Promise<UploadScanResult>; }

export async function storeWithSha256(
  storage: SecureObjectStorage, key: string, body: ObjectBody, contentType: string,
): Promise<{ size: number; checksumSha256: string }> {
  const hash = createHash("sha256"); let size = 0;
  const counted = (async function* () { for await (const raw of body) { const chunk = Buffer.from(raw); size += chunk.length; hash.update(chunk); yield chunk; } })();
  const stored = await storage.putImmutable(key, counted, contentType);
  if (stored.size !== size) throw new FileSecurityError("integrity_mismatch", 503);
  return { size, checksumSha256: hash.digest("hex") };
}

export async function scanStoredObject(input: {
  storage: SecureObjectStorage; scanner: StoredByteScanner; key: string; expectedSize: number; expectedChecksumSha256: string;
}): Promise<{ status: "CLEAN"; size: number; checksumSha256: string }> {
  const stored = await input.storage.get(input.key);
  if (stored.size !== input.expectedSize) throw new FileSecurityError("integrity_mismatch", 422);
  const hash = createHash("sha256"); let size = 0;
  const exactBytes = (async function* () { for await (const raw of stored.body) { const chunk = Buffer.from(raw); size += chunk.length; hash.update(chunk); yield chunk; } })();
  const result = await input.scanner.scanStream(exactBytes);
  const checksumSha256 = hash.digest("hex");
  if (size !== input.expectedSize || checksumSha256 !== input.expectedChecksumSha256) throw new FileSecurityError("integrity_mismatch", 422);
  if (result === "INFECTED") throw new FileSecurityError("infected", 422);
  if (result === "SUSPICIOUS") throw new FileSecurityError("suspicious", 422);
  if (result !== "CLEAN") throw new FileSecurityError("scanner_unavailable", 503);
  return { status: "CLEAN", size, checksumSha256 };
}

export class DeterministicStoredByteScanner implements StoredByteScanner {
  constructor(private readonly result: UploadScanResult = "CLEAN") {}
  async scanStream(body: ObjectBody): Promise<UploadScanResult> { for await (const _chunk of body) void _chunk; return this.result; }
}
