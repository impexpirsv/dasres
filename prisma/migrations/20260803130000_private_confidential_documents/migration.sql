BEGIN;

ALTER TABLE "CaseDocument" RENAME COLUMN "fileUrl" TO "storageKey";
ALTER TABLE "CaseDocument" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "fileSize" INTEGER;

ALTER TABLE "ProjectTaskAttachment" RENAME COLUMN "fileUrl" TO "storageKey";

CREATE UNIQUE INDEX "CaseDocument_storageKey_key" ON "CaseDocument"("storageKey");
CREATE UNIQUE INDEX "ProjectTaskAttachment_storageKey_key" ON "ProjectTaskAttachment"("storageKey");

COMMIT;
