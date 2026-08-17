import { AppError } from "../errors";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { removeCaseDocumentFile } from "../storage/case-document-storage";
import { canAccessCaseDocuments } from "./case-document-permissions";
import type { SecureObjectStorage } from "../storage/secure-object-storage";

export async function deleteCaseDocument(input: { documentId: number; authenticatedUserId: number; objectStorage?: SecureObjectStorage }): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.authenticatedUserId }, select: { role: true } });
  const document = await prisma.caseDocument.findUnique({ where: { id: input.documentId }, select: { storageKey: true, storageProvider: true,
    tradeCase: { select: { customerId: true, acceptedProposalId: true, proposals: { where: { status: "ACCEPTED" }, select: { id: true, company: { select: { ownerId: true } }, expert: { select: { ownerId: true } } } } } } } });
  if (!user || !document || !canAccessCaseDocuments({ userId: input.authenticatedUserId, userRole: user.role, customerId: document.tradeCase.customerId,
    acceptedProposalId: document.tradeCase.acceptedProposalId, acceptedProviders: document.tradeCase.proposals })) throw new AppError("CASE_DOCUMENT_NOT_FOUND", 404);
  await prisma.caseDocument.delete({ where: { id: input.documentId } });
  await removeCaseDocumentFile(document.storageKey, document.storageProvider, input.objectStorage).catch((error: unknown) => logger.error("Deleted case document object cleanup failed.", { documentId: input.documentId, error: error instanceof Error ? error : String(error) }));
}
