ALTER TABLE "ProjectTask"
ADD COLUMN IF NOT EXISTS "dependsOnId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProjectTask_dependsOnId_fkey'
  ) THEN
    ALTER TABLE "ProjectTask"
    ADD CONSTRAINT "ProjectTask_dependsOnId_fkey"
    FOREIGN KEY ("dependsOnId")
    REFERENCES "ProjectTask"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
