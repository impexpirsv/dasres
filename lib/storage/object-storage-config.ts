import "server-only";

import { FileSecurityError } from "../security/file-security-errors";
import { FILE_SECURITY_LIMITS } from "../security/file-security-limits";

export type ObjectStorageConfig = Readonly<{
  endpoint: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  operationTimeoutMs: number;
}>;

const PLACEHOLDER_PATTERN = /(?:replace[-_ ]with|example|your[-_ ])/i;
const REGION_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/i;
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const CREDENTIAL_PATTERN = /^[\x21-\x7e]{8,512}$/;

function required(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value || PLACEHOLDER_PATTERN.test(value)) {
    throw new FileSecurityError("configuration", 503);
  }
  return value;
}

export function getObjectStorageConfig(): ObjectStorageConfig {
  const endpointValue = required("OBJECT_STORAGE_ENDPOINT");
  const region = required("OBJECT_STORAGE_REGION");
  const bucket = required("OBJECT_STORAGE_BUCKET");
  const accessKeyId = required("OBJECT_STORAGE_ACCESS_KEY_ID");
  const secretAccessKey = required("OBJECT_STORAGE_SECRET_ACCESS_KEY");

  let endpoint: URL;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    throw new FileSecurityError("configuration", 503);
  }

  const allowLoopbackHttp = (() => {
    if (process.env.OBJECT_STORAGE_ALLOW_INSECURE_LOOPBACK_TESTS !== "1" || endpoint.protocol !== "http:" || process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) return false;
    try {
      const database = new URL(process.env.TEST_DATABASE_URL ?? "");
      return ["127.0.0.1", "localhost", "::1"].includes(endpoint.hostname) && ["127.0.0.1", "localhost", "::1"].includes(database.hostname);
    } catch { return false; }
  })();

  if (
    (endpoint.protocol !== "https:" && !allowLoopbackHttp) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== "/" ||
    !REGION_PATTERN.test(region) ||
    !BUCKET_PATTERN.test(bucket) ||
    !CREDENTIAL_PATTERN.test(accessKeyId) ||
    !CREDENTIAL_PATTERN.test(secretAccessKey)
  ) {
    throw new FileSecurityError("configuration", 503);
  }

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    operationTimeoutMs: FILE_SECURITY_LIMITS.storageOperationTimeoutMs,
  };
}
