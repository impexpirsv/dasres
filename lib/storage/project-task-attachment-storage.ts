import "server-only";
import { getSecureObject, readLegacyPrivateFile, removeLegacyPrivateFile, removeSecureObject, storeConfidentialUpload, streamBoundedObject, type ConfidentialFileDependencies } from "./confidential-file-storage";
import type { SecureObjectStorage } from "./secure-object-storage";

export const storeProjectTaskAttachmentFile = ({ request, dependencies }: { request: Request; taskId: number; dependencies?: ConfidentialFileDependencies }) => storeConfidentialUpload({ request, kind: "project-attachment", dependencies });
export async function removeProjectTaskAttachmentFile(key: string | null, provider = "r2", injected?: SecureObjectStorage): Promise<void> { if (!key) return; if (provider === "r2") await removeSecureObject(key, injected); else await removeLegacyPrivateFile({ root: "project-task-attachments", storageKey: key }); }
export async function readProjectTaskAttachmentFile(key: string, provider: string, injected?: SecureObjectStorage) {
  if (provider === "r2") { const object = await getSecureObject(key, injected); return { body: streamBoundedObject(object), size: object.size }; }
  return readLegacyPrivateFile({ root: "project-task-attachments", storageKey: key });
}
