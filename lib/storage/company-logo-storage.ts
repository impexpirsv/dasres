import path from "node:path";

import { logger } from "../logger";
import type { PublicImageDependencies, StoredPublicImage } from "./public-image-storage";
import { storePublicImage } from "./public-image-storage";
import { LocalStorageProvider } from "./storage-provider";

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "public", "uploads", "companies");
const storageProvider = new LocalStorageProvider(UPLOAD_DIRECTORY);

export type StoredCompanyLogo = StoredPublicImage;

export function resolveCompanyLogoFilePath(logoUrl: string | null): string | null {
  const prefix = "/uploads/companies/";
  if (!logoUrl?.startsWith(prefix)) return null;
  const fileName = logoUrl.slice(prefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return null;
  const resolved = path.resolve(UPLOAD_DIRECTORY, fileName);
  return resolved.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`) ? resolved : null;
}
export async function storeCompanyLogoFile(
  file: File,
  dependencies?: PublicImageDependencies,
): Promise<StoredCompanyLogo> {
  return storePublicImage({ file, kind: "company-logo", dependencies });
}

export async function removeCompanyLogoFile(savedFilePath: string | null): Promise<void> {
  if (!savedFilePath) return;
  try {
    const fileName = path.basename(savedFilePath);
    if (storageProvider.resolve(fileName) !== path.resolve(savedFilePath)) return;
    await storageProvider.remove(fileName);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code !== "ENOENT") logger.error("COMPANY_LOGO_CLEANUP_ERROR", { savedFilePath });
  }
}
