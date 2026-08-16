import { randomUUID } from "node:crypto";

import { FileSecurityError } from "../security/file-security-errors";

export const STORAGE_OBJECT_KINDS = [
  "case-document",
  "project-attachment",
  "company-logo",
  "expert-image",
  "opportunity-image",
] as const;

export type StorageObjectKind = (typeof STORAGE_OBJECT_KINDS)[number];

const STORAGE_KEY_PATTERN = /^quarantine\/(case-document|project-attachment|company-logo|expert-image|opportunity-image)\/(\d{4})\/(0[1-9]|1[0-2])\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/;

export function createQuarantineObjectKey(
  kind: StorageObjectKind,
  now = new Date(),
): string {
  if (!STORAGE_OBJECT_KINDS.includes(kind)) {
    throw new FileSecurityError("invalid_key");
  }
  const year = String(now.getUTCFullYear()).padStart(4, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `quarantine/${kind}/${year}/${month}/${randomUUID()}`;
}

export function assertValidStorageObjectKey(storageKey: string): void {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) {
    throw new FileSecurityError("invalid_key");
  }
}
