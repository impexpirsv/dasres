import { randomUUID } from "crypto";
import path from "path";

import { AppError } from "../errors";
import { logger } from "../logger";
import { assertUploadIsClean } from "../security/upload-scanner";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";
import { LocalStorageProvider } from "./storage-provider";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const MAX_FILE_NAME_LENGTH = 255;

const DEFAULT_STORAGE_DIRECTORY =
  path.join(
    process.cwd(),
    "storage",
    "private",
    "cases",
  );

const storageProvider =
  new LocalStorageProvider(
    DEFAULT_STORAGE_DIRECTORY,
  );

type FileSignature =
  | "PDF"
  | "JPEG"
  | "PNG"
  | "WEBP"
  | "OLE"
  | "ZIP";

type AllowedFileType = {
  extensions: readonly string[];
  signature: FileSignature;
};

const ALLOWED_FILE_TYPES = new Map<
  string,
  AllowedFileType
>([
  [
    "application/pdf",
    {
      extensions: [".pdf"],
      signature: "PDF",
    },
  ],
  [
    "application/msword",
    {
      extensions: [".doc"],
      signature: "OLE",
    },
  ],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    {
      extensions: [".docx"],
      signature: "ZIP",
    },
  ],
  [
    "application/vnd.ms-excel",
    {
      extensions: [".xls"],
      signature: "OLE",
    },
  ],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    {
      extensions: [".xlsx"],
      signature: "ZIP",
    },
  ],
  [
    "image/jpeg",
    {
      extensions: [
        ".jpg",
        ".jpeg",
      ],
      signature: "JPEG",
    },
  ],
  [
    "image/png",
    {
      extensions: [".png"],
      signature: "PNG",
    },
  ],
  [
    "image/webp",
    {
      extensions: [".webp"],
      signature: "WEBP",
    },
  ],
]);

export type StoredCaseDocumentFile = {
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
};

function getUploadDirectory(): string {
  return DEFAULT_STORAGE_DIRECTORY;
}

function resolveStoragePath(storageKey: string): string {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(storageKey)) {
    throw new AppError("CASE_DOCUMENT_STORAGE_KEY_INVALID", 500);
  }

  const storageDirectory = path.resolve(getUploadDirectory());
  const storagePath = path.resolve(storageDirectory, storageKey);

  if (path.dirname(storagePath) !== storageDirectory) {
    throw new AppError("CASE_DOCUMENT_STORAGE_KEY_INVALID", 500);
  }

  return storagePath;
}

function hasValidSignature(
  bytes: Uint8Array,
  signature: FileSignature,
): boolean {
  switch (signature) {
    case "PDF":
      return (
        bytes.length >= 5 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
      );

    case "JPEG":
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );

    case "PNG":
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );

    case "WEBP":
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );

    case "OLE":
      return (
        bytes.length >= 8 &&
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0 &&
        bytes[4] === 0xa1 &&
        bytes[5] === 0xb1 &&
        bytes[6] === 0x1a &&
        bytes[7] === 0xe1
      );

    case "ZIP":
      return (
        bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        (
          (
            bytes[2] === 0x03 &&
            bytes[3] === 0x04
          ) ||
          (
            bytes[2] === 0x05 &&
            bytes[3] === 0x06
          ) ||
          (
            bytes[2] === 0x07 &&
            bytes[3] === 0x08
          )
        )
      );
  }
}

function normalizeOriginalFileName(
  fileName: string,
): string {
  const originalFileName = path
    .basename(fileName)
    .normalize("NFKC")
    .trim();

  if (
    !originalFileName ||
    originalFileName === "." ||
    originalFileName === ".."
  ) {
    throw new AppError(
      "INVALID_FILE_NAME",
      400,
    );
  }

  if (
    originalFileName.length >
    MAX_FILE_NAME_LENGTH
  ) {
    throw new AppError(
      `FILE_NAME_TOO_LONG:${MAX_FILE_NAME_LENGTH}`,
      400,
    );
  }

  if (
    /[\u0000-\u001f\u007f]/.test(
      originalFileName,
    )
  ) {
    throw new AppError(
      "INVALID_FILE_NAME",
      400,
    );
  }

  return originalFileName;
}

function createStoredFileName(
  originalFileName: string,
): string {
  const extension = path
    .extname(originalFileName)
    .toLowerCase();

  return `${randomUUID()}${extension}`;
}

async function parseFile(
  request: Request,
): Promise<{
  originalFileName: string;
  bytes: Uint8Array;
  mimeType: string;
  fileSize: number;
}> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.CONFIDENTIAL_DOCUMENT);

  let formData: FormData;

  try {
    formData =
      await request.formData();
  } catch {
    throw new AppError(
      "INVALID_MULTIPART_FORM_DATA",
      400,
    );
  }

  const value =
    formData.get("file");

  if (!(value instanceof File)) {
    throw new AppError(
      "FILE_REQUIRED",
      400,
    );
  }

  if (value.size <= 0) {
    throw new AppError(
      "EMPTY_FILE_NOT_ALLOWED",
      400,
    );
  }

  if (
    value.size > MAX_FILE_SIZE
  ) {
    throw new AppError(
      `FILE_TOO_LARGE:${MAX_FILE_SIZE}`,
      413,
    );
  }

  const allowedType =
    ALLOWED_FILE_TYPES.get(
      value.type,
    );

  if (!allowedType) {
    throw new AppError(
      "UNSUPPORTED_FILE_TYPE",
      415,
    );
  }

  const originalFileName =
    normalizeOriginalFileName(
      value.name,
    );

  const extension = path
    .extname(originalFileName)
    .toLowerCase();

  if (
    !allowedType.extensions.includes(
      extension,
    )
  ) {
    throw new AppError(
      "FILE_EXTENSION_MISMATCH",
      400,
    );
  }

  const bytes = new Uint8Array(
    await value.arrayBuffer(),
  );

  if (
    bytes.byteLength !== value.size
  ) {
    throw new AppError(
      "FILE_READ_FAILED",
      400,
    );
  }

  if (
    !hasValidSignature(
      bytes,
      allowedType.signature,
    )
  ) {
    throw new AppError(
      "INVALID_FILE_CONTENT",
      400,
    );
  }

  return {
    originalFileName,
    bytes,
    mimeType: value.type.toLowerCase(),
    fileSize: value.size,
  };
}

export async function storeCaseDocumentFile(
  request: Request,
): Promise<StoredCaseDocumentFile> {
  const {
    originalFileName,
    bytes,
    mimeType,
    fileSize,
  } = await parseFile(request);

  const storedFileName =
    createStoredFileName(
      originalFileName,
    );

  await assertUploadIsClean({
    bytes,
    fileName: originalFileName,
    mimeType,
  });

  await storageProvider.write(
    storedFileName,
    Buffer.from(bytes),
  );

  return {
    storageKey: storedFileName,
    originalFileName,
    mimeType,
    fileSize,
  };
}

export async function removeCaseDocumentFile(
  storageKey: string | null,
): Promise<void> {
  if (!storageKey) {
    return;
  }

  try {
    resolveStoragePath(storageKey);
    await storageProvider.remove(
      storageKey,
    );
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(error.code)
        : null;

    if (errorCode !== "ENOENT") {
      logger.error(
        "Failed to clean up case document file.",
        {
          storageKey,
          error:
            error instanceof Error
              ? error
              : String(error),
        },
      );
    }
  }
}

export async function readCaseDocumentFile(storageKey: string): Promise<{ bytes: Buffer; size: number }> {
  resolveStoragePath(storageKey);

  try {
    return await storageProvider.read(
      storageKey,
    );
  } catch {
    throw new AppError(
      "CASE_DOCUMENT_FILE_NOT_FOUND",
      404,
    );
  }
}
