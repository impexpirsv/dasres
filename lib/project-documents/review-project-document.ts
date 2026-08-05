import {
  ApprovalStatus,
  Prisma,
} from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const MAX_REJECTION_REASON_LENGTH = 1_000;

const DEFAULT_REJECTION_REASON =
  "REJECTED_BY_ADMIN";

const REVIEWED_DOCUMENT_SELECT = {
  id: true,
  fileName: true,
  storageProvider: true,
  mimeType: true,
  fileSize: true,
  approvalStatus: true,
  approvedById: true,
  approvedAt: true,
  rejectionReason: true,
  uploadedById: true,
  taskId: true,
  createdAt: true,
  task: {
    select: {
      projectId: true,
    },
  },
} satisfies Prisma.ProjectTaskAttachmentSelect;

export type ReviewedProjectDocument =
  Prisma.ProjectTaskAttachmentGetPayload<{
    select: typeof REVIEWED_DOCUMENT_SELECT;
  }>;

export type RejectProjectDocumentInput = {
  rejectionReason: string;
};

export type ReviewProjectDocumentResult = {
  document: ReviewedProjectDocument;
  alreadyInRequestedState: boolean;
};

type ReviewProjectDocumentCommand = {
  documentId: number;
  authenticatedUserId: number;
  targetStatus: ApprovalStatus;
  rejectionReason: string | null;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseRejectProjectDocumentInput(
  body: unknown,
): RejectProjectDocumentInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  const value = body.rejectionReason;

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return {
      rejectionReason:
        DEFAULT_REJECTION_REASON,
    };
  }

  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_DOCUMENT_REJECTION_REASON",
      400,
    );
  }

  const rejectionReason = value.trim();

  if (!rejectionReason) {
    return {
      rejectionReason:
        DEFAULT_REJECTION_REASON,
    };
  }

  if (
    rejectionReason.length >
    MAX_REJECTION_REASON_LENGTH
  ) {
    throw new AppError(
      "DOCUMENT_REJECTION_REASON_TOO_LONG",
      400,
    );
  }

  return {
    rejectionReason,
  };
}

function isTransactionConflict(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

function getConflictCode(
  targetStatus: ApprovalStatus,
): string {
  return targetStatus ===
    ApprovalStatus.APPROVED
    ? "PROJECT_DOCUMENT_APPROVAL_CONFLICT"
    : "PROJECT_DOCUMENT_REJECTION_CONFLICT";
}

async function reviewProjectDocument({
  documentId,
  authenticatedUserId,
  targetStatus,
  rejectionReason,
}: ReviewProjectDocumentCommand): Promise<ReviewProjectDocumentResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: {
              id: authenticatedUserId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!authenticatedUser) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        if (
          authenticatedUser.role !==
          "admin"
        ) {
          throw new AppError(
            "ADMIN_ACCESS_REQUIRED",
            403,
          );
        }

        const existingDocument =
          await transaction.projectTaskAttachment.findUnique({
            where: {
              id: documentId,
            },
            select: {
              id: true,
              fileName: true,
              approvalStatus: true,
              approvedById: true,
              approvedAt: true,
              rejectionReason: true,
              uploadedById: true,
              taskId: true,
              task: {
                select: {
                  id: true,
                  projectId: true,
                  project: {
                    select: {
                      tradeCaseId: true,
                    },
                  },
                },
              },
            },
          });

        if (!existingDocument) {
          throw new AppError(
            "PROJECT_DOCUMENT_NOT_FOUND",
            404,
          );
        }

        if (
          existingDocument.approvalStatus ===
          targetStatus
        ) {
          const document =
            await transaction.projectTaskAttachment.findUnique({
              where: {
                id: existingDocument.id,
              },
              select:
                REVIEWED_DOCUMENT_SELECT,
            });

          if (!document) {
            throw new AppError(
              "PROJECT_DOCUMENT_NOT_FOUND",
              404,
            );
          }

          return {
            document,
            alreadyInRequestedState: true,
          };
        }

        const reviewedAt = new Date();

        const document =
          await transaction.projectTaskAttachment.update({
            where: {
              id: existingDocument.id,
            },
            data: {
              approvalStatus:
                targetStatus,
              approvedById:
                authenticatedUser.id,
              approvedAt:
                reviewedAt,
              rejectionReason:
                targetStatus ===
                ApprovalStatus.REJECTED
                  ? rejectionReason
                  : null,
            },
            select:
              REVIEWED_DOCUMENT_SELECT,
          });

        const isApproval =
          targetStatus ===
          ApprovalStatus.APPROVED;

        await transaction.caseActivity.create({
          data: {
            caseId:
              existingDocument.task.project
                .tradeCaseId,
            userId:
              authenticatedUser.id,
            action: isApproval
              ? "PROJECT_DOCUMENT_APPROVED"
              : "PROJECT_DOCUMENT_REJECTED",
            details: JSON.stringify({
              documentId:
                document.id,
              taskId:
                document.taskId,
              projectId:
                document.task.projectId,
              fileName:
                document.fileName,
              uploadedById:
                document.uploadedById,
              previousApprovalStatus:
                existingDocument.approvalStatus,
              previousReviewedById:
                existingDocument.approvedById,
              previousReviewedAt:
                existingDocument.approvedAt,
              previousRejectionReason:
                existingDocument.rejectionReason,
              approvalStatus:
                document.approvalStatus,
              reviewedById:
                authenticatedUser.id,
              reviewedAt:
                document.approvedAt,
              rejectionReason:
                document.rejectionReason,
            }),
          },
        });

        return {
          document,
          alreadyInRequestedState: false,
        };
      },
    );
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw new AppError(
        getConflictCode(targetStatus),
        409,
      );
    }

    throw error;
  }
}

export async function approveProjectDocument({
  documentId,
  authenticatedUserId,
}: {
  documentId: number;
  authenticatedUserId: number;
}): Promise<ReviewProjectDocumentResult> {
  return reviewProjectDocument({
    documentId,
    authenticatedUserId,
    targetStatus:
      ApprovalStatus.APPROVED,
    rejectionReason: null,
  });
}

export async function rejectProjectDocument({
  documentId,
  authenticatedUserId,
  input,
}: {
  documentId: number;
  authenticatedUserId: number;
  input: RejectProjectDocumentInput;
}): Promise<ReviewProjectDocumentResult> {
  return reviewProjectDocument({
    documentId,
    authenticatedUserId,
    targetStatus:
      ApprovalStatus.REJECTED,
    rejectionReason:
      input.rejectionReason,
  });
}
