import { randomUUID } from "crypto";
import path from "path";

import { AppError } from "../errors";
import { logger } from "../logger";
import { assertUploadIsClean } from "../security/upload-scanner";
import { LocalStorageProvider } from "./storage-provider";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set<string>([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const IMAGE_EXTENSION_MAP:
  Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

const PUBLIC_DIRECTORY =
  path.resolve(
    process.cwd(),
    "public",
  );

const UPLOAD_DIRECTORY =
  path.resolve(
    PUBLIC_DIRECTORY,
    "uploads",
    "experts",
  );

const UPLOAD_URL_PREFIX =
  "/uploads/experts/";

const storageProvider =
  new LocalStorageProvider(
    UPLOAD_DIRECTORY,
  );

export type StoredExpertImage = {
  imageUrl: string;
  savedFilePath: string;
};

function matchesImageSignature(
  buffer: Buffer,
  mimeType: string,
): boolean {
  if (
    mimeType === "image/jpeg"
  ) {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (
    mimeType === "image/png"
  ) {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (
    mimeType === "image/webp"
  ) {
    return (
      buffer.length >= 12 &&
      buffer
        .subarray(0, 4)
        .toString("ascii") ===
        "RIFF" &&
      buffer
        .subarray(8, 12)
        .toString("ascii") ===
        "WEBP"
    );
  }

  return false;
}

export function resolveExpertImageFilePath(
  imageUrl: string | null,
): string | null {
  if (
    !imageUrl ||
    !imageUrl.startsWith(
      UPLOAD_URL_PREFIX,
    )
  ) {
    return null;
  }

  const relativeFileName =
    imageUrl.slice(
      UPLOAD_URL_PREFIX.length,
    );

  const fileName =
    path.basename(
      relativeFileName,
    );

  if (
    !fileName ||
    fileName !==
      relativeFileName
  ) {
    return null;
  }

  const resolvedPath =
    path.resolve(
      UPLOAD_DIRECTORY,
      fileName,
    );

  if (
    !resolvedPath.startsWith(
      `${UPLOAD_DIRECTORY}${path.sep}`,
    )
  ) {
    return null;
  }

  return resolvedPath;
}

export async function storeExpertImageFile(
  imageFile: File,
): Promise<StoredExpertImage> {
  if (
    !ALLOWED_IMAGE_TYPES.has(
      imageFile.type,
    )
  ) {
    throw new AppError(
      "INVALID_EXPERT_IMAGE_TYPE",
      400,
    );
  }

  if (
    imageFile.size >
    MAX_FILE_SIZE
  ) {
    throw new AppError(
      "EXPERT_IMAGE_TOO_LARGE",
      400,
    );
  }

  const fileExtension =
    IMAGE_EXTENSION_MAP[
      imageFile.type
    ];

  if (!fileExtension) {
    throw new AppError(
      "INVALID_EXPERT_IMAGE_TYPE",
      400,
    );
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = Buffer.from(
      await imageFile.arrayBuffer(),
    );
  } catch {
    throw new AppError(
      "EXPERT_IMAGE_READ_FAILED",
      400,
    );
  }

  if (
    fileBuffer.length === 0 ||
    fileBuffer.length !==
      imageFile.size ||
    !matchesImageSignature(
      fileBuffer,
      imageFile.type,
    )
  ) {
    throw new AppError(
      "INVALID_EXPERT_IMAGE_CONTENT",
      400,
    );
  }

  const fileName =
    `${randomUUID()}.${fileExtension}`;

  await assertUploadIsClean({
    bytes: fileBuffer,
    fileName: imageFile.name,
    mimeType: imageFile.type,
  });

  const savedFilePath =
    storageProvider.resolve(
      fileName,
    );

  try {
    await storageProvider.write(
      fileName,
      fileBuffer,
    );
  } catch (error) {
    logger.error(
      "EXPERT_IMAGE_WRITE_ERROR",
      {
        savedFilePath,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    throw new AppError(
      "EXPERT_IMAGE_SAVE_FAILED",
      500,
    );
  }

  return {
    imageUrl:
      `${UPLOAD_URL_PREFIX}${fileName}`,
    savedFilePath,
  };
}

export async function removeExpertImageFile(
  savedFilePath: string | null,
): Promise<void> {
  if (!savedFilePath) {
    return;
  }

  try {
    const fileName =
      path.basename(savedFilePath);

    if (
      storageProvider.resolve(fileName) !==
      path.resolve(savedFilePath)
    ) {
      return;
    }

    await storageProvider.remove(fileName);
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(error.code)
        : null;

    if (errorCode !== "ENOENT") {
      logger.error(
        "EXPERT_IMAGE_CLEANUP_ERROR",
        {
          savedFilePath,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
    }
  }
}
