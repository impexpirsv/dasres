import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main(): Promise<void> {
const files = await Promise.all([
  "lib/storage/r2-storage-provider.ts",
  "lib/security/upload-request.ts",
  "lib/security/clamav-upload-scanner.ts",
  "lib/storage/file-content-validation.ts",
  "lib/storage/file-scan-workflow.ts",
  "prisma/migrations/20260815160000_secure_file_storage_foundation/migration.sql",
].map((file) => readFile(file, "utf8")));
const [r2, multipart, clam, content, workflow, migration] = files;
assert.match(r2, /IfNoneMatch: "\*"/);
assert.doesNotMatch(r2, /ACL:|getSignedUrl|publicUrl/);
assert.match(multipart, /maximumRequestBytes/);
assert.doesNotMatch(multipart, /\.formData\(|\.arrayBuffer\(/);
assert.match(clam, /zINSTREAM\\0/);
assert.doesNotMatch(clam, /exec|spawn|console\./);
assert.match(content, /ooxmlCompressionRatio/);
assert.match(workflow, /integrity_mismatch/);
assert.match(migration, /CREATE TYPE "FileScanStatus"/);
assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE FROM|UPDATE /i);
console.log("File-storage static invariants verified (runtime behavior is covered by files:test).");
}

main().catch((error: unknown) => { throw error; });
