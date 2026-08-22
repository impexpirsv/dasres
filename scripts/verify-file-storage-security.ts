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
  "lib/storage/public-image-storage.ts",
  "app/api/images/[domain]/[id]/route.ts",
  "scripts/migrate-public-images.ts",
  "prisma/migrations/20260819120000_secure_public_images/migration.sql",
  "scripts/integration/public-images-postgres.ts",
  "lib/security/trusted-client-ip.ts",
  "lib/health/readiness.ts",
  "scripts/migrate-confidential-files.ts",
  "lib/storage/confidential-legacy-migration.ts",
  "deploy/Caddyfile",
  "deploy/dasres.service",
].map((file) => readFile(file, "utf8")));
const [r2, multipart, clam, content, workflow, migration, confidential, caseStorage, taskStorage, caseUpload, caseDownload, taskUpload, taskDownload,
  caseDelete, taskDelete, caseUploadRoute, caseDownloadRoute, taskUploadRoute, taskDownloadRoute, integration,
  publicImage, publicImageRoute, publicImageMigration, imageMigration, publicImageIntegration,
  trustedIp, readiness, confidentialMigration, confidentialMigrationCore, caddy, systemd] = files;
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
assert.match(publicImage, /limitInputPixels: PUBLIC_IMAGE_LIMITS\.pixels/);
assert.match(publicImage, /\(metadata\.pages \?\? 1\) !== 1/);
assert.match(publicImage, /storeWithSha256/);
assert.match(publicImage, /scanStoredObject/);
assert.doesNotMatch(publicImage, /withMetadata|getSignedUrl|publicUrl|ACL:/);
assert.match(publicImageRoute, /scanStatus !== "CLEAN"/);
assert.match(publicImageRoute, /storageProvider !== "r2"/);
assert.match(publicImageMigration, /--apply/);
assert.match(publicImageMigration, /TEST_DATABASE_URL is required/);
assert.match(publicImageMigration, /TEST_DATABASE_URL must differ from DATABASE_URL/);
assert.match(publicImageMigration, /disposable loopback PostgreSQL/);
assert.match(publicImageMigration, /--acknowledge-production/);
assert.doesNotMatch(publicImageMigration, /unlink|rmSync|rename\(/);
assert.doesNotMatch(imageMigration, /DROP|TRUNCATE|DELETE FROM|UPDATE /i);
assert.match(publicImageIntegration, /TEST_DATABASE_URL/);
assert.match(publicImageIntegration, /InMemorySecureObjectStorage/);
assert.match(trustedIp, /timingSafeEqual/); assert.match(trustedIp, /TRUSTED_PROXY_SECRET/);
assert.doesNotMatch(trustedIp, /x-forwarded-for|x-real-ip|cf-connecting-ip|x-vercel-forwarded-for/i);
assert.match(readiness, /SELECT 1/); assert.match(readiness, /READINESS_TIMEOUT_MS/);
assert.match(confidentialMigration, /--production --apply --acknowledge-production/);
assert.match(confidentialMigration, /TEST_DATABASE_URL must differ from DATABASE_URL/);
assert.match(confidentialMigrationCore, /conditional_conflict/);
assert.doesNotMatch(confidentialMigrationCore, /unlink|rename\(|https?:\/\//);
assert.match(caddy, /127\.0\.0\.1:3000/); assert.match(caddy, /max_size 12MB/);
assert.match(caddy, /X-Dasres-Proxy-Secret/); assert.doesNotMatch(systemd, /migrate|prisma/);
assert.match(systemd, /^ProtectSystem=strict$/m);
assert.match(systemd, /^CacheDirectory=dasres-next$/m);
assert.match(systemd, /^CacheDirectoryMode=0750$/m);
assert.match(systemd, /^BindPaths=\/var\/cache\/dasres-next:\/srv\/dasres\/current\/\.next\/cache$/m);
assert.match(systemd, /^ReadWritePaths=\/srv\/dasres\/legacy-private$/m);
assert.doesNotMatch(systemd, /^ReadWritePaths=.*(?:\/srv\/dasres\/current|\/\.next(?:\s|$))/m);
console.log("File-storage static structural guardrails verified; runtime behavior requires the dedicated runtime and integration suites.");
}

main().catch((error: unknown) => { throw error; });
