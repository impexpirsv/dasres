import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import {
  removeCaseDocumentFile,
  storeCaseDocumentFile,
} from "../storage/case-document-storage";
import { runInTransaction } from "../transactions";
import { canAccessCaseDocuments } from "./case-document-permissions";

type CaseDocumentResult = {
  id: number;
  caseId: number;
  uploaderId: number;
  name: string;
  createdAt: Date;
  uploader: {
    id: number;
    name: string | null;
    email: string;
  };
};

function isTransactionConflict(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function uploadCaseDocument({
  request,
  caseId,
  authenticatedUserId,
}: {
  request: Request;
  caseId: number;
  authenticatedUserId: number;
}): Promise<CaseDocumentResult> {
  const access = await prisma.tradeCase.findUnique({
    where: { id: caseId },
    select: {
      status: true,
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
  });
  const accessUser = await prisma.user.findUnique({
    where: { id: authenticatedUserId },
    select: { role: true },
  });
  if (!accessUser) throw new AppError("AUTHENTICATED_USER_NOT_FOUND", 401);
  if (!access) throw new AppError("CASE_NOT_FOUND", 404);
  if (access.status !== "IN_PROGRESS") throw new AppError("CASE_NOT_IN_PROGRESS", 409);
  if (
    access.acceptedProposalId === null ||
    !access.proposals.some((proposal) => proposal.id === access.acceptedProposalId)
  ) {
    throw new AppError("CASE_ACCEPTED_PROPOSAL_NOT_FOUND", 409);
  }
  if (!canAccessCaseDocuments({
    userId: authenticatedUserId,
    userRole: accessUser.role,
    customerId: access.customerId,
    acceptedProposalId: access.acceptedProposalId,
    acceptedProviders: access.proposals,
  })) throw new AppError("CASE_DOCUMENT_UPLOAD_ACCESS_DENIED", 403);

  let storedFileKey: string | null =
    null;

  try {
    const storedFile =
      await storeCaseDocumentFile(
        request,
      );

    storedFileKey = storedFile.storageKey;

    let document: CaseDocumentResult;

    try {
      document = await runInTransaction(
        async (transaction) => {
          const authenticatedUser =
            await transaction.user.findUnique({
              where: {
                id: authenticatedUserId,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            });

          if (!authenticatedUser) {
            throw new AppError(
              "AUTHENTICATED_USER_NOT_FOUND",
              401,
            );
          }

          const tradeCase =
            await transaction.tradeCase.findUnique({
              where: {
                id: caseId,
              },
              select: {
                id: true,
                title: true,
                status: true,
                customerId: true,
                acceptedProposalId: true,
                proposals: {
                  where: {
                    status: "ACCEPTED",
                  },
                  select: {
                    id: true,
                    company: {
                      select: {
                        ownerId: true,
                      },
                    },
                    expert: {
                      select: {
                        ownerId: true,
                      },
                    },
                  },
                },
              },
            });

          if (!tradeCase) {
            throw new AppError(
              "CASE_NOT_FOUND",
              404,
            );
          }

          if (
            tradeCase.status !==
            "IN_PROGRESS"
          ) {
            throw new AppError(
              "CASE_NOT_IN_PROGRESS",
              409,
            );
          }

          if (
            tradeCase
              .acceptedProposalId ===
            null
          ) {
            throw new AppError(
              "CASE_ACCEPTED_PROPOSAL_NOT_FOUND",
              409,
            );
          }

          const acceptedProposal =
            tradeCase.proposals.find(
              (proposal) =>
                proposal.id ===
                tradeCase
                  .acceptedProposalId,
            );

          if (!acceptedProposal) {
            throw new AppError(
              "CASE_ACCEPTED_PROPOSAL_NOT_FOUND",
              409,
            );
          }

          const providerUserIds =
            new Set<number>();

          if (
            acceptedProposal.company
              ?.ownerId
          ) {
            providerUserIds.add(
              acceptedProposal.company
                .ownerId,
            );
          }

          if (
            acceptedProposal.expert
              ?.ownerId
          ) {
            providerUserIds.add(
              acceptedProposal.expert
                .ownerId,
            );
          }

          const hasAccess =
            authenticatedUser.role ===
              "admin" ||
            tradeCase.customerId ===
              authenticatedUser.id ||
            providerUserIds.has(
              authenticatedUser.id,
            );

          if (!hasAccess) {
            throw new AppError(
              "CASE_DOCUMENT_UPLOAD_ACCESS_DENIED",
              403,
            );
          }

          const createdDocument =
            await transaction.caseDocument.create({
              data: {
                caseId: tradeCase.id,
                uploaderId:
                  authenticatedUser.id,
                name:
                  storedFile.originalFileName,
                storageKey: storedFile.storageKey,
                mimeType: storedFile.mimeType,
                fileSize: storedFile.fileSize,
              },
              select: {
                id: true,
                caseId: true,
                uploaderId: true,
                name: true,
                createdAt: true,
                uploader: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

          const senderName =
            authenticatedUser.name ??
            authenticatedUser.email;

          await transaction.caseActivity.create({
            data: {
              caseId: tradeCase.id,
              userId:
                authenticatedUser.id,
              action:
                "DOCUMENT_UPLOADED",
              details:
                `${senderName} uploaded document: ${storedFile.originalFileName}`,
            },
          });

          const receiverIds =
            new Set<number>();

          if (
            tradeCase.customerId !==
            authenticatedUser.id
          ) {
            receiverIds.add(
              tradeCase.customerId,
            );
          }

          for (
            const providerUserId of
            providerUserIds
          ) {
            if (
              providerUserId !==
              authenticatedUser.id
            ) {
              receiverIds.add(
                providerUserId,
              );
            }
          }

          if (
            receiverIds.size > 0
          ) {
            await transaction.notification.createMany({
              data: Array.from(
                receiverIds,
              ).map(
                (receiverId) => ({
                  userId: receiverId,
                  title:
                    "New case document",
                  message:
                    `${senderName} uploaded a document in case: ${tradeCase.title}`,
                  type:
                    "DOCUMENT_UPLOADED",
                  link:
                    `/dashboard/cases/${tradeCase.id}`,
                }),
              ),
            });
          }

          return createdDocument;
        },
      );
    } catch (error) {
      if (
        isTransactionConflict(error)
      ) {
        throw new AppError(
          "CASE_DOCUMENT_UPLOAD_CONFLICT",
          409,
        );
      }

      throw error;
    }

    storedFileKey = null;

    return document;
  } catch (error) {
    await removeCaseDocumentFile(
      storedFileKey,
    );

    throw error;
  }
}
