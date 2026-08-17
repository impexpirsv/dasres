import "server-only";
import { getSecureObject, readLegacyPrivateFile, removeLegacyPrivateFile, removeSecureObject, storeConfidentialUpload, streamBoundedObject, type ConfidentialFileDependencies } from "./confidential-file-storage";
import type { SecureObjectStorage } from "./secure-object-storage";

export const storeCaseDocumentFile = (request: Request, injected?: ConfidentialFileDependencies) => storeConfidentialUpload({ request, kind: "case-document", dependencies: injected });
export async function removeCaseDocumentFile(key: string | null, provider = "r2", injected?: SecureObjectStorage): Promise<void> { if (!key) return; if (provider === "r2") await removeSecureObject(key, injected); else await removeLegacyPrivateFile({ root: "cases", storageKey: key }); }
export async function readCaseDocumentFile(key: string, provider: string, injected?: SecureObjectStorage) {
  if (provider === "r2") { const object = await getSecureObject(key, injected); return { body: streamBoundedObject(object), size: object.size }; }
  return readLegacyPrivateFile({ root: "cases", storageKey: key });
}
