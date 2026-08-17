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
  "lib/storage/confidential-file-storage.ts",
  "lib/storage/case-document-storage.ts",
  "lib/storage/project-task-attachment-storage.ts",
  "lib/cases/upload-case-document.ts",
  "lib/cases/download-case-document.ts",
  "lib/project-task-attachments/upload-project-task-attachment.ts",
  "lib/project-task-attachments/download-project-task-attachment.ts",
  "lib/cases/delete-case-document.ts",
  "lib/project-task-attachments/delete-project-task-attachment.ts",
  "app/api/cases/[id]/documents/route.ts",
  "app/api/cases/documents/[id]/download/route.ts",
  "app/api/project-tasks/[id]/attachments/route.ts",
  "app/api/project-task-attachments/[id]/download/route.ts",
  "scripts/integration/account-recovery-postgres.ts",
].map((file) => readFile(file, "utf8")));
const [r2, multipart, clam, content, workflow, migration, confidential, caseStorage, taskStorage, caseUpload, caseDownload, taskUpload, taskDownload,
  caseDelete, taskDelete, caseUploadRoute, caseDownloadRoute, taskUploadRoute, taskDownloadRoute, integration] = files;
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
for (const migrated of [confidential, caseStorage, taskStorage]) {
  assert.doesNotMatch(migrated, /request\.formData\(|public[\\/]uploads|getSignedUrl|publicUrl/);
}
assert.match(confidential, /parseBoundedMultipartUpload/);
assert.match(confidential, /validateFileContent/);
assert.match(confidential, /scanStoredObject/);
assert.match(confidential, /"storage", "private"/);
assert.match(caseUpload, /storageProvider: storedFile\.storageProvider/);
assert.match(taskUpload, /storageProvider:[\s\S]*storedFile\.storageProvider/);
assert.match(caseDownload, /scanStatus !== "CLEAN"/);
assert.match(taskDownload, /scanStatus !== "CLEAN"/);
// These are structural guardrails only. Runtime integration is the source of
// truth for authentication, authorization order, cleanup, confinement, and
// streaming/backpressure behavior.
for (const route of [caseUploadRoute, caseDownloadRoute, taskUploadRoute, taskDownloadRoute]) assert.match(route, /requireApiUser\(\)/);
assert.match(caseDelete, /caseDocument\.findUnique/); assert.match(caseDelete, /removeCaseDocumentFile\(document\.storageKey/);
assert.match(taskDelete, /projectTaskAttachment\.findUnique/); assert.match(taskDelete, /removeProjectTaskAttachmentFile\(attachment\.storageKey/);
assert.doesNotMatch(`${caseDelete}\n${taskDelete}`, /input\.(?:storageKey|objectKey)/);
assert.match(integration, /server\.listen\(\{ host: "127\.0\.0\.1", port: 0, exclusive: true \}/);
assert.match(integration, /Test database host must be local/); assert.match(integration, /TEST_DATABASE_URL must differ from DATABASE_URL/);
assert.doesNotMatch(integration, /const TEST_PORT = 55432/);
assert.match(integration, /runFileRouteHttpSuite/);
assert.match(integration, /file-storage-domains-postgres\.ts/);
console.log("File-storage static structural guardrails verified; security behavior is proven by runtime suites.");
}

main().catch((error: unknown) => { throw error; });
