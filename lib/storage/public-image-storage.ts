import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

import { FileSecurityError } from "../security/file-security-errors";
import { logger } from "../logger";
import { ClamAvUploadScanner } from "../security/clamav-upload-scanner";
import type { StoredByteScanner } from "./file-scan-workflow";
import { scanStoredObject, storeWithSha256 } from "./file-scan-workflow";
import { createQuarantineObjectKey } from "./object-key";
import { R2StorageProvider } from "./r2-storage-provider";
import type { SecureObjectStorage, StoredObject } from "./secure-object-storage";

export const PUBLIC_IMAGE_LIMITS = {
  fileBytes: 5 * 1024 * 1024,
  requestBytes: 6 * 1024 * 1024,
  width: 8_192,
  height: 8_192,
  pixels: 25_000_000,
} as const;

export type PublicImageKind =
  | "company-logo"
  | "expert-image"
  | "opportunity-image";

export type PublicImageDomain = "company" | "expert" | "opportunity";

export function createPublicImageUrl(domain: PublicImageDomain, id: number): string {
  return `/api/images/${domain}/${id}`;
}

export type PublicImageDependencies = Readonly<{
  storage: SecureObjectStorage;
  scanner: StoredByteScanner;
}>;

export type StoredPublicImage = Readonly<{
  storageKey: string;
  storageProvider: "r2";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileSize: number;
  checksumSha256: string;
  scanStatus: "CLEAN";
  scannedAt: Date;
  scanEngine: "clamav";
  scanAttempts: 1;
}>;

type ImageFormat = "jpeg" | "png" | "webp";

const FORMAT_POLICY: Readonly<
  Record<
    StoredPublicImage["mimeType"],
    { format: ImageFormat; extensions: readonly string[] }
  >
> = {
  "image/jpeg": { format: "jpeg", extensions: [".jpg", ".jpeg"] },
  "image/png": { format: "png", extensions: [".png"] },
  "image/webp": { format: "webp", extensions: [".webp"] },
};

function defaultDependencies(): PublicImageDependencies {
  return {
    storage: new R2StorageProvider(),
    scanner: new ClamAvUploadScanner(),
  };
}

function bytesBody(bytes: Buffer): AsyncIterable<Uint8Array> {
  return (async function* () {
    yield bytes;
  })();
}

export async function normalizePublicImage(file: File): Promise<{
  bytes: Buffer;
  mimeType: StoredPublicImage["mimeType"];
}> {
  const mimeType = file.type.trim().toLowerCase();
  const policy = FORMAT_POLICY[mimeType as StoredPublicImage["mimeType"]];
  const extension = path.extname(file.name).toLowerCase();

  if (!policy || !policy.extensions.includes(extension)) {
    throw new FileSecurityError("invalid_content", 422);
  }

  if (file.size <= 0 || file.size > PUBLIC_IMAGE_LIMITS.fileBytes) {
    throw new FileSecurityError("payload_too_large", 413);
  }

  let input: Buffer;
  try {
    input = Buffer.from(await file.arrayBuffer());
  } catch {
    throw new FileSecurityError("invalid_upload", 400);
  }

  if (input.length !== file.size) {
    throw new FileSecurityError("integrity_mismatch", 422);
  }

  try {
    const image = sharp(input, {
      animated: true,
      failOn: "warning",
      limitInputPixels: PUBLIC_IMAGE_LIMITS.pixels,
    });
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.pageHeight ?? metadata.height ?? 0;

    if (
      metadata.format !== policy.format ||
      width <= 0 ||
      height <= 0 ||
      width > PUBLIC_IMAGE_LIMITS.width ||
      height > PUBLIC_IMAGE_LIMITS.height ||
      width * height > PUBLIC_IMAGE_LIMITS.pixels ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new FileSecurityError("invalid_content", 422);
    }

    const normalized = image.rotate();
    const bytes =
      policy.format === "jpeg"
        ? await normalized.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
        : policy.format === "png"
          ? await normalized.png({ compressionLevel: 9 }).toBuffer()
          : await normalized.webp({ quality: 85 }).toBuffer();

    if (bytes.length > PUBLIC_IMAGE_LIMITS.fileBytes) {
      throw new FileSecurityError("payload_too_large", 413);
    }

    return {
      bytes,
      mimeType: mimeType as StoredPublicImage["mimeType"],
    };
  } catch (error) {
    if (error instanceof FileSecurityError) throw error;
    throw new FileSecurityError("invalid_content", 422);
  }
}

export async function storePublicImage(input: {
  file: File;
  kind: PublicImageKind;
  dependencies?: PublicImageDependencies;
}): Promise<StoredPublicImage> {
  const normalized = await normalizePublicImage(input.file);
  const active = input.dependencies ?? defaultDependencies();
  const storageKey = createQuarantineObjectKey(input.kind);
  let stored = false;

  try {
    stored = true;
    const written = await storeWithSha256(
      active.storage,
      storageKey,
      bytesBody(normalized.bytes),
      normalized.mimeType,
    );
    const scanned = await scanStoredObject({
      storage: active.storage,
      scanner: active.scanner,
      key: storageKey,
      expectedSize: written.size,
      expectedChecksumSha256: written.checksumSha256,
    });

    return {
      storageKey,
      storageProvider: "r2",
      mimeType: normalized.mimeType,
      fileSize: scanned.size,
      checksumSha256: scanned.checksumSha256,
      scanStatus: "CLEAN",
      scannedAt: new Date(),
      scanEngine: "clamav",
      scanAttempts: 1,
    };
  } catch (error) {
    if (stored) {
      await active.storage.remove(storageKey).catch(() => undefined);
    }
    throw error;
  }
}

export async function removePublicImage(
  storageKey: string,
  storage: SecureObjectStorage = new R2StorageProvider(),
): Promise<void> {
  await storage.remove(storageKey);
}

export async function removePublicImageBestEffort(
  storageKey: string | null,
  storage?: SecureObjectStorage,
): Promise<void> {
  if (!storageKey) return;
  try {
    await removePublicImage(storageKey, storage);
  } catch {
    logger.error("PUBLIC_IMAGE_CLEANUP_ERROR", { storageKey });
  }
}

export async function getPublicImageObject(input: {
  storageKey: string;
  expectedSize: number;
  storage?: SecureObjectStorage;
}): Promise<StoredObject> {
  const object = await (input.storage ?? new R2StorageProvider()).get(input.storageKey);
  if (object.size !== input.expectedSize || object.size > PUBLIC_IMAGE_LIMITS.fileBytes) {
    throw new FileSecurityError("integrity_mismatch", 404);
  }
  return object;
}

export function createVerifiedPublicImageStream(input: {
  object: StoredObject;
  expectedSize: number;
  expectedChecksumSha256: string;
}): ReadableStream<Uint8Array> {
  if (input.object.size !== input.expectedSize || input.expectedSize > PUBLIC_IMAGE_LIMITS.fileBytes) {
    throw new FileSecurityError("integrity_mismatch", 404);
  }

  const iterator = input.object.body[Symbol.asyncIterator]();
  const hash = createHash("sha256");
  let size = 0;
  let settled = false;

  const closeSource = async (): Promise<void> => {
    if (settled) return;
    settled = true;
    await iterator.return?.();
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) {
          settled = true;
          if (size !== input.expectedSize || hash.digest("hex") !== input.expectedChecksumSha256) {
            controller.error(new FileSecurityError("integrity_mismatch", 404));
          } else {
            controller.close();
          }
          return;
        }

        const chunk = Buffer.from(next.value);
        size += chunk.length;
        if (size > input.expectedSize || size > PUBLIC_IMAGE_LIMITS.fileBytes) {
          await closeSource();
          controller.error(new FileSecurityError("integrity_mismatch", 404));
          return;
        }
        hash.update(chunk);
        controller.enqueue(chunk);
      } catch (error) {
        await closeSource().catch(() => undefined);
        controller.error(error);
      }
    },
    async cancel() {
      await closeSource();
    },
  });
}
