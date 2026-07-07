UPDATE "ProjectTask"
SET "estimatedHours" = 0
WHERE "estimatedHours" IS NULL;