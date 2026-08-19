import path from "node:path";

import { logger } from "../logger";
import type { PublicImageDependencies, StoredPublicImage } from "./public-image-storage";
import { storePublicImage } from "./public-image-storage";
import { LocalStorageProvider } from "./storage-provider";

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "public", "uploads", "experts");
const storageProvider = new LocalStorageProvider(UPLOAD_DIRECTORY);

export type StoredExpertImage = StoredPublicImage;

export function resolveExpertImageFilePath(imageUrl: string | null): string | null {
  const prefix = "/uploads/experts/";
  if (!imageUrl?.startsWith(prefix)) return null;
  const fileName = imageUrl.slice(prefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return null;
  const resolved = path.resolve(UPLOAD_DIRECTORY, fileName);
  return resolved.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`) ? resolved : null;
}
export async function storeExpertImageFile(
  file: File,
  dependencies?: PublicImageDependencies,
): Promise<StoredExpertImage> {
  return storePublicImage({ file, kind: "expert-image", dependencies });
}

export async function removeExpertImageFile(savedFilePath: string | null): Promise<void> {
  if (!savedFilePath) return;
  try {
    const fileName = path.basename(savedFilePath);
    if (storageProvider.resolve(fileName) !== path.resolve(savedFilePath)) return;
    await storageProvider.remove(fileName);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code !== "ENOENT") logger.error("EXPERT_IMAGE_CLEANUP_ERROR", { savedFilePath });
  }
}
