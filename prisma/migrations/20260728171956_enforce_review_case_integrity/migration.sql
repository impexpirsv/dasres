/*
  Warnings:

  - A unique constraint covering the columns `[caseId,reviewerId,reviewedUserId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Made the column `caseId` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "caseId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_caseId_reviewerId_reviewedUserId_key" ON "Review"("caseId", "reviewerId", "reviewedUserId");
