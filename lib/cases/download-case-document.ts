import { AppError } from "../errors";
import { prisma } from "../prisma";
import { createPrivateDownloadResponse } from "../storage/private-download-response";
import { readCaseDocumentFile } from "../storage/case-document-storage";
import { canAccessCaseDocuments } from "./case-document-permissions";
import type { SecureObjectStorage } from "../storage/secure-object-storage";

export async function downloadCaseDocument({
  documentId,
  authenticatedUserId,
  objectStorage,
}: {
  documentId: number;
  authenticatedUserId: number;
  objectStorage?: SecureObjectStorage;
}): Promise<Response> {
  const [user, document] = await Promise.all([
    prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { id: true, role: true } }),
    prisma.caseDocument.findUnique({
      where: { id: documentId },
      select: {
        name: true,
        storageKey: true,
        storageProvider: true,
        mimeType: true,
        scanStatus: true,
        tradeCase: {
          select: {
            customerId: true,
            acceptedProposalId: true,
            proposals: {
              where: { status: "ACCEPTED" },
              select: {
                id: true,
                company: { select: { ownerId: true } },
                expert: { select: { ownerId: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user || !document || !canAccessCaseDocuments({
    userId: authenticatedUserId,
    userRole: user.role,
    customerId: document.tradeCase.customerId,
    acceptedProposalId: document.tradeCase.acceptedProposalId,
    acceptedProviders: document.tradeCase.proposals,
  })) {
    throw new AppError("CASE_DOCUMENT_NOT_FOUND", 404);
  }

  if (document.storageProvider === "r2" && document.scanStatus !== "CLEAN") {
    throw new AppError("CASE_DOCUMENT_NOT_FOUND", 404);
  }

  const file = await readCaseDocumentFile(document.storageKey, document.storageProvider, objectStorage);
  return createPrivateDownloadResponse({
    body: "body" in file ? file.body : new Uint8Array(file.bytes),
    contentLength: file.size,
    fileName: document.name,
    mimeType: document.mimeType || "application/octet-stream",
  });
}
