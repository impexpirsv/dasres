import { randomUUID } from "crypto";
import path from "path";

import { AppError } from "../errors";
import { logger } from "../logger";
import { assertUploadIsClean } from "../security/upload-scanner";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";
import { LocalStorageProvider } from "./storage-provider";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const MAX_ORIGINAL_FILE_NAME_LENGTH =
  255;

const DEFAULT_STORAGE_DIRECTORY =
  path.join(
    process.cwd(),
    "storage",
    "private",
    "project-task-attachments",
  );

const storageProvider =
  new LocalStorageProvider(
    DEFAULT_STORAGE_DIRECTORY,
  );

type AllowedFileType = {
  extensions: readonly string[];
  storedExtension: string;
  validateContent: (
    buffer: Buffer,
  ) => boolean;
};

function isZipFile(
  buffer: Buffer,
): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (
      (
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      ) ||
      (
        buffer[2] === 0x05 &&
        buffer[3] === 0x06
      ) ||
      (
        buffer[2] === 0x07 &&
        buffer[3] === 0x08
      )
    )
  );
}

function containsZipEntryName(
  buffer: Buffer,
  entryName: string,
): boolean {
  return buffer.includes(
    Buffer.from(entryName, "utf8"),
  );
}

const ALLOWED_FILE_TYPES =
  new Map<string, AllowedFileType>([
    [
      "image/jpeg",
      {
        extensions: [
          ".jpg",
          ".jpeg",
        ],
        storedExtension: ".jpg",
        validateContent: (buffer) =>
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff,
      },
    ],
    [
      "image/png",
      {
        extensions: [".png"],
        storedExtension: ".png",
        validateContent: (buffer) =>
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a,
      },
    ],
    [
      "image/webp",
      {
        extensions: [".webp"],
        storedExtension: ".webp",
        validateContent: (buffer) =>
          buffer.length >= 12 &&
          buffer
            .subarray(0, 4)
            .toString("ascii") ===
            "RIFF" &&
          buffer
            .subarray(8, 12)
            .toString("ascii") ===
            "WEBP",
      },
    ],
    [
      "application/pdf",
      {
        extensions: [".pdf"],
        storedExtension: ".pdf",
        validateContent: (buffer) =>
          buffer.length >= 5 &&
          buffer
            .subarray(0, 5)
            .toString("ascii") ===
            "%PDF-",
      },
    ],
    [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      {
        extensions: [".docx"],
        storedExtension: ".docx",
        validateContent: (buffer) =>
          isZipFile(buffer) &&
          containsZipEntryName(
            buffer,
            "[Content_Types].xml",
          ) &&
          containsZipEntryName(
            buffer,
            "word/",
          ),
      },
    ],
    [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      {
        extensions: [".xlsx"],
        storedExtension: ".xlsx",
        validateContent: (buffer) =>
          isZipFile(buffer) &&
          containsZipEntryName(
            buffer,
            "[Content_Types].xml",
          ) &&
          containsZipEntryName(
            buffer,
            "xl/",
          ),
      },
    ],
  ]);

export type StoredProjectTaskAttachmentFile = {
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: "local";
};

function getUploadDirectory(): string {
  return DEFAULT_STORAGE_DIRECTORY;
}

function resolveStoragePath(storageKey: string): string {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(storageKey)) {
    throw new AppError("PROJECT_TASK_ATTACHMENT_STORAGE_KEY_INVALID", 500);
  }
  const storageDirectory = path.resolve(getUploadDirectory());
  const storagePath = path.resolve(storageDirectory, storageKey);
  if (path.dirname(storagePath) !== storageDirectory) {
    throw new AppError("PROJECT_TASK_ATTACHMENT_STORAGE_KEY_INVALID", 500);
  }
  return storagePath;
}

function normalizeOriginalFileName(
  fileName: string,
): string {
  const originalFileName =
    fileName
      .split(/[\\/]/)
      .pop()
      ?.normalize("NFKC")
      .trim() || "";

  if (
    !originalFileName ||
    originalFileName === "." ||
    originalFileName === ".."
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_NAME_INVALID",
      400,
    );
  }

  if (
    originalFileName.length >
    MAX_ORIGINAL_FILE_NAME_LENGTH
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_NAME_TOO_LONG",
      400,
    );
  }

  if (
    /[\u0000-\u001f\u007f]/.test(
      originalFileName,
    )
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_NAME_INVALID",
      400,
    );
  }

  return originalFileName;
}

async function parseUpload(
  request: Request,
): Promise<{
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
  storedExtension: string;
}> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.CONFIDENTIAL_DOCUMENT);

  const contentType =
    request.headers.get(
      "content-type",
    );

  if (
    !contentType ||
    !contentType
      .toLowerCase()
      .startsWith(
        "multipart/form-data",
      )
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  let formData: FormData;

  try {
    formData =
      await request.formData();
  } catch {
    throw new AppError(
      "INVALID_FORM_DATA",
      400,
    );
  }

  const fileValue =
    formData.get("file");

  if (
    !(fileValue instanceof File)
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_REQUIRED",
      400,
    );
  }

  if (fileValue.size <= 0) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_EMPTY",
      400,
    );
  }

  if (
    fileValue.size >
    MAX_FILE_SIZE
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_TOO_LARGE",
      400,
    );
  }

  const mimeType =
    fileValue.type
      .trim()
      .toLowerCase();

  const allowedFileType =
    ALLOWED_FILE_TYPES.get(
      mimeType,
    );

  if (!allowedFileType) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_TYPE_NOT_ALLOWED",
      400,
    );
  }

  const originalFileName =
    normalizeOriginalFileName(
      fileValue.name,
    );

  const originalExtension =
    path
      .extname(originalFileName)
      .toLowerCase();

  if (
    !allowedFileType.extensions.includes(
      originalExtension,
    )
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_EXTENSION_MISMATCH",
      400,
    );
  }

  const buffer = Buffer.from(
    await fileValue.arrayBuffer(),
  );

  if (
    buffer.length !==
    fileValue.size
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_SIZE_MISMATCH",
      400,
    );
  }

  if (
    !allowedFileType.validateContent(
      buffer,
    )
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_CONTENT_INVALID",
      400,
    );
  }

  return {
    originalFileName,
    mimeType,
    fileSize:
      fileValue.size,
    buffer,
    storedExtension:
      allowedFileType.storedExtension,
  };
}

export async function storeProjectTaskAttachmentFile({
  request,
}: {
  request: Request;
  taskId: number;
}): Promise<StoredProjectTaskAttachmentFile> {
  const upload =
    await parseUpload(request);

  const storedFileName =
    `${randomUUID()}` +
    upload.storedExtension;

  await assertUploadIsClean({
    bytes: upload.buffer,
    fileName:
      upload.originalFileName,
    mimeType: upload.mimeType,
  });

  await storageProvider.write(
    storedFileName,
    upload.buffer,
  );

  return {
    storageKey: storedFileName,
    originalFileName:
      upload.originalFileName,
    mimeType:
      upload.mimeType,
    fileSize:
      upload.fileSize,
    storageProvider:
      "local",
  };
}

export async function removeProjectTaskAttachmentFile(
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
        "Project task attachment file cleanup failed.",
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

export async function readProjectTaskAttachmentFile(storageKey: string): Promise<{ bytes: Buffer; size: number }> {
  resolveStoragePath(storageKey);

  try {
    return await storageProvider.read(
      storageKey,
    );
  } catch {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_FILE_NOT_FOUND",
      404,
    );
  }
}
