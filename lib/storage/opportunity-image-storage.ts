import path from "node:path";

import { logger } from "../logger";
import type { PublicImageDependencies, StoredPublicImage } from "./public-image-storage";
import { storePublicImage } from "./public-image-storage";
import { LocalStorageProvider } from "./storage-provider";

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "public", "uploads", "opportunities");
const storageProvider = new LocalStorageProvider(UPLOAD_DIRECTORY);

export type StoredOpportunityImage = StoredPublicImage;

export function resolveOpportunityImageFilePath(imageUrl: string | null): string | null {
  const prefix = "/uploads/opportunities/";
  if (!imageUrl?.startsWith(prefix)) return null;
  const fileName = imageUrl.slice(prefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return null;
  const resolved = path.resolve(UPLOAD_DIRECTORY, fileName);
  return resolved.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`) ? resolved : null;
}
export async function storeOpportunityImageFile(
  file: File,
  dependencies?: PublicImageDependencies,
): Promise<StoredOpportunityImage> {
  return storePublicImage({ file, kind: "opportunity-image", dependencies });
}

export async function removeOpportunityImageFile(absolutePath: string | null): Promise<void> {
  if (!absolutePath) return;
  try {
    const fileName = path.basename(absolutePath);
    if (storageProvider.resolve(fileName) !== path.resolve(absolutePath)) return;
    await storageProvider.remove(fileName);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code !== "ENOENT") logger.error("OPPORTUNITY_IMAGE_CLEANUP_ERROR", { absolutePath });
  }
}
