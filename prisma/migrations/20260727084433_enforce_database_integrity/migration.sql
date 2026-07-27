/*
  Warnings:

  - Made the column `companyId` on table `CaseProposal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CaseProposal" DROP CONSTRAINT "CaseProposal_companyId_fkey";

-- AlterTable
ALTER TABLE "CaseProposal" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CaseProposal" ADD CONSTRAINT "CaseProposal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProjectTask constraints
ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_progress_check"
CHECK ("progress" >= 0 AND "progress" <= 100);

ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_actualHours_check"
CHECK ("actualHours" IS NULL OR "actualHours" >= 0);

ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_estimatedHours_check"
CHECK ("estimatedHours" IS NULL OR "estimatedHours" >= 0);

ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_loggedHours_check"
CHECK ("loggedHours" >= 0);

ALTER TABLE "ProjectTask"
ADD CONSTRAINT "ProjectTask_remainingHours_check"
CHECK ("remainingHours" >= 0);

-- Review constraints
ALTER TABLE "Review"
ADD CONSTRAINT "Review_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);

-- Only one active proposal (PENDING or ACCEPTED)
-- is allowed for a company in a case.
CREATE UNIQUE INDEX
"CaseProposal_one_active_company_per_case"
ON "CaseProposal" ("caseId", "companyId")
WHERE "status" IN ('PENDING', 'ACCEPTED');