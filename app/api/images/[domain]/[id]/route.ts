import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { createVerifiedPublicImageStream, getPublicImageObject } from "../../../../../lib/storage/public-image-storage";
import { parseId } from "../../../../../lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ domain: string; id: string }>;
};

type ImageRecord = {
  storageKey: string | null;
  storageProvider: string | null;
  mimeType: string | null;
  fileSize: number | null;
  checksumSha256: string | null;
  scanStatus: string | null;
  scannedAt: Date | null;
  scanEngine: string | null;
  scanAttempts: number;
};

async function findImage(domain: string, id: number): Promise<ImageRecord | null> {
  if (domain === "company") {
    const row = await prisma.company.findUnique({
      where: { id },
      select: {
        logoStorageKey: true, logoStorageProvider: true, logoMimeType: true,
        logoFileSize: true, logoChecksumSha256: true, logoScanStatus: true,
        logoScannedAt: true, logoScanEngine: true, logoScanAttempts: true,
      },
    });
    return row ? {
      storageKey: row.logoStorageKey, storageProvider: row.logoStorageProvider,
      mimeType: row.logoMimeType, fileSize: row.logoFileSize,
      checksumSha256: row.logoChecksumSha256, scanStatus: row.logoScanStatus,
      scannedAt: row.logoScannedAt, scanEngine: row.logoScanEngine,
      scanAttempts: row.logoScanAttempts,
    } : null;
  }

  if (domain === "expert") {
    const row = await prisma.expert.findUnique({
      where: { id },
      select: {
        imageStorageKey: true, imageStorageProvider: true, imageMimeType: true,
        imageFileSize: true, imageChecksumSha256: true, imageScanStatus: true,
        imageScannedAt: true, imageScanEngine: true, imageScanAttempts: true,
      },
    });
    return row ? {
      storageKey: row.imageStorageKey, storageProvider: row.imageStorageProvider,
      mimeType: row.imageMimeType, fileSize: row.imageFileSize,
      checksumSha256: row.imageChecksumSha256, scanStatus: row.imageScanStatus,
      scannedAt: row.imageScannedAt, scanEngine: row.imageScanEngine,
      scanAttempts: row.imageScanAttempts,
    } : null;
  }

  if (domain === "opportunity") {
    const row = await prisma.opportunity.findUnique({
      where: { id },
      select: {
        imageStorageKey: true, imageStorageProvider: true, imageMimeType: true,
        imageFileSize: true, imageChecksumSha256: true, imageScanStatus: true,
        imageScannedAt: true, imageScanEngine: true, imageScanAttempts: true,
      },
    });
    return row ? {
      storageKey: row.imageStorageKey, storageProvider: row.imageStorageProvider,
      mimeType: row.imageMimeType, fileSize: row.imageFileSize,
      checksumSha256: row.imageChecksumSha256, scanStatus: row.imageScanStatus,
      scannedAt: row.imageScannedAt, scanEngine: row.imageScanEngine,
      scanAttempts: row.imageScanAttempts,
    } : null;
  }

  return null;
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  return apiHandler(async () => {
    const { domain, id: idValue } = await params;
    const id = parseId(idValue, "image id");
    const image = await findImage(domain, id);

    if (
      !image?.storageKey || image.storageProvider !== "r2" ||
      !["image/jpeg", "image/png", "image/webp"].includes(image.mimeType ?? "") ||
      !image.fileSize || !image.checksumSha256 || image.scanStatus !== "CLEAN" ||
      !image.scannedAt || image.scanEngine !== "clamav" || image.scanAttempts < 1
    ) {
      throw new AppError("IMAGE_NOT_FOUND", 404);
    }

    const mimeType = image.mimeType as "image/jpeg" | "image/png" | "image/webp";
    const fileSize = image.fileSize;

    const object = await getPublicImageObject({
      storageKey: image.storageKey,
      expectedSize: fileSize,
    });

    return new Response(createVerifiedPublicImageStream({
      object,
      expectedSize: fileSize,
      expectedChecksumSha256: image.checksumSha256,
    }), {
      headers: {
        "Cache-Control": "public, max-age=300, must-revalidate",
        "Content-Disposition": "inline",
        "Content-Length": String(fileSize),
        "Content-Type": mimeType,
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
