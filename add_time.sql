ALTER TABLE "ProjectTask"
ADD COLUMN IF NOT EXISTS "loggedHours" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProjectTask"
ADD COLUMN IF NOT EXISTS "remainingHours" INTEGER NOT NULL DEFAULT 0;

UPDATE "ProjectTask"
SET "loggedHours" = 0
WHERE "loggedHours" IS NULL;

UPDATE "ProjectTask"
SET "remainingHours" = 0
WHERE "remainingHours" IS NULL;
