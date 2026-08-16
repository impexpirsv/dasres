-- Existing rows remain NULL (legacy/unscanned) and are never treated as CLEAN.
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING_SCAN', 'CLEAN', 'INFECTED', 'SCAN_FAILED');

ALTER TABLE "CaseDocument"
ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN "checksumSha256" TEXT,
ADD COLUMN "scanStatus" "FileScanStatus",
ADD COLUMN "scannedAt" TIMESTAMP(3),
ADD COLUMN "scanEngine" TEXT,
ADD COLUMN "scanAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProjectTaskAttachment"
ADD COLUMN "checksumSha256" TEXT,
ADD COLUMN "scanStatus" "FileScanStatus",
ADD COLUMN "scannedAt" TIMESTAMP(3),
ADD COLUMN "scanEngine" TEXT,
ADD COLUMN "scanAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Company"
ADD COLUMN "logoStorageKey" TEXT,
ADD COLUMN "logoStorageProvider" TEXT,
ADD COLUMN "logoMimeType" TEXT,
ADD COLUMN "logoFileSize" INTEGER,
ADD COLUMN "logoChecksumSha256" TEXT,
ADD COLUMN "logoScanStatus" "FileScanStatus",
ADD COLUMN "logoScannedAt" TIMESTAMP(3);

ALTER TABLE "Expert"
ADD COLUMN "imageStorageKey" TEXT,
ADD COLUMN "imageStorageProvider" TEXT,
ADD COLUMN "imageMimeType" TEXT,
ADD COLUMN "imageFileSize" INTEGER,
ADD COLUMN "imageChecksumSha256" TEXT,
ADD COLUMN "imageScanStatus" "FileScanStatus",
ADD COLUMN "imageScannedAt" TIMESTAMP(3);

ALTER TABLE "Opportunity"
ADD COLUMN "imageStorageKey" TEXT,
ADD COLUMN "imageStorageProvider" TEXT,
ADD COLUMN "imageMimeType" TEXT,
ADD COLUMN "imageFileSize" INTEGER,
ADD COLUMN "imageChecksumSha256" TEXT,
ADD COLUMN "imageScanStatus" "FileScanStatus",
ADD COLUMN "imageScannedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Company_logoStorageKey_key" ON "Company"("logoStorageKey");
CREATE UNIQUE INDEX "Expert_imageStorageKey_key" ON "Expert"("imageStorageKey");
CREATE UNIQUE INDEX "Opportunity_imageStorageKey_key" ON "Opportunity"("imageStorageKey");
CREATE INDEX "CaseDocument_scanStatus_createdAt_idx" ON "CaseDocument"("scanStatus", "createdAt");
CREATE INDEX "ProjectTaskAttachment_scanStatus_createdAt_idx" ON "ProjectTaskAttachment"("scanStatus", "createdAt");
