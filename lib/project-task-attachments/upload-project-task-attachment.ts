import {
  Prisma,
} from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { notifyDocumentUploaded } from "../notificationEvents";
import {
  removeProjectTaskAttachmentFile,
  storeProjectTaskAttachmentFile,
} from "../storage/project-task-attachment-storage";
import { runInTransaction } from "../transactions";
import { canAccessProjectTaskAttachments } from "./project-task-attachment-permissions";
import type { ConfidentialFileDependencies } from "../storage/confidential-file-storage";

const ATTACHMENT_SELECT = {
  id: true,
  taskId: true,
  fileName: true,
  storageProvider: true,
  mimeType: true,
  fileSize: true,
  uploadedById: true,
  approvalStatus: true,
  approvedById: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectTaskAttachmentSelect;

export type UploadedProjectTaskAttachment =
  Prisma.ProjectTaskAttachmentGetPayload<{
    select: typeof ATTACHMENT_SELECT;
  }>;

type AttachmentTransactionResult = {
  attachment: UploadedProjectTaskAttachment;
  receiverId: number | null;
  projectId: number;
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

function ensureUploadPermission({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): void {
  const isAdmin =
    userRole === "admin";

  const isCustomer =
    projectCreatedBy === userId;

  const isProvider =
    projectAssignedTo === userId;

  if (
    !isAdmin &&
    !isCustomer &&
    !isProvider
  ) {
    throw new AppError(
      "PROJECT_TASK_ATTACHMENT_UPLOAD_NOT_ALLOWED",
      403,
    );
  }
}

function resolveNotificationReceiver({
  authenticatedUserId,
  projectCreatedBy,
  projectAssignedTo,
}: {
  authenticatedUserId: number;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): number | null {
  if (
    projectCreatedBy ===
    authenticatedUserId
  ) {
    return projectAssignedTo;
  }

  if (
    projectAssignedTo ===
    authenticatedUserId
  ) {
    return projectCreatedBy;
  }

  return (
    projectCreatedBy ??
    projectAssignedTo
  );
}

export async function uploadProjectTaskAttachment({
  request,
  taskId,
  authenticatedUserId,
  fileDependencies,
}: {
  request: Request;
  taskId: number;
  authenticatedUserId: number;
  fileDependencies?: ConfidentialFileDependencies;
}): Promise<UploadedProjectTaskAttachment> {
  const [accessUser, accessTask] = await Promise.all([
    prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { role: true } }),
    prisma.projectTask.findUnique({
      where: { id: taskId },
      select: { project: { select: { createdBy: true, assignedTo: true } } },
    }),
  ]);
  if (!accessUser) throw new AppError("AUTHENTICATED_USER_NOT_FOUND", 401);
  if (!accessTask) throw new AppError("PROJECT_TASK_NOT_FOUND", 404);
  if (!canAccessProjectTaskAttachments({
    userId: authenticatedUserId,
    userRole: accessUser.role,
    projectCreatedBy: accessTask.project.createdBy,
    projectAssignedTo: accessTask.project.assignedTo,
  })) throw new AppError("PROJECT_TASK_ATTACHMENT_UPLOAD_NOT_ALLOWED", 403);

  let storedFileKey: string | null =
    null;

  try {
    const storedFile =
      await storeProjectTaskAttachmentFile({
        request,
        taskId,
        dependencies: fileDependencies,
      });

    storedFileKey = storedFile.storageKey;

    let result: AttachmentTransactionResult;

    try {
      result = await runInTransaction(
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

          const task =
            await transaction.projectTask.findUnique({
              where: {
                id: taskId,
              },
              select: {
                id: true,
                projectId: true,
                project: {
                  select: {
                    id: true,
                    createdBy: true,
                    assignedTo: true,
                    tradeCaseId: true,
                  },
                },
              },
            });

          if (!task) {
            throw new AppError(
              "PROJECT_TASK_NOT_FOUND",
              404,
            );
          }

          ensureUploadPermission({
            userId:
              authenticatedUser.id,
            userRole:
              authenticatedUser.role,
            projectCreatedBy:
              task.project.createdBy,
            projectAssignedTo:
              task.project.assignedTo,
          });

          const attachment =
            await transaction.projectTaskAttachment.create({
              data: {
                taskId: task.id,
                fileName:
                  storedFile.originalFileName,
                storageKey: storedFile.storageKey,
                storageProvider:
                  storedFile.storageProvider,
                mimeType:
                  storedFile.mimeType,
                fileSize:
                  storedFile.fileSize,
                checksumSha256:
                  storedFile.checksumSha256,
                scanStatus:
                  storedFile.scanStatus,
                scannedAt:
                  storedFile.scannedAt,
                scanEngine:
                  storedFile.scanEngine,
                scanAttempts:
                  storedFile.scanAttempts,
                uploadedById:
                  authenticatedUser.id,
              },
              select:
                ATTACHMENT_SELECT,
            });

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId:
                authenticatedUser.id,
              action:
                "PROJECT_TASK_ATTACHMENT_UPLOADED",
              details: JSON.stringify({
                attachmentId:
                  attachment.id,
                taskId: task.id,
                projectId:
                  task.projectId,
                fileName:
                  storedFile.originalFileName,
                mimeType:
                  storedFile.mimeType,
                fileSize:
                  storedFile.fileSize,
                storageProvider:
                  storedFile.storageProvider,
              }),
            },
          });

          return {
            attachment,
            receiverId:
              resolveNotificationReceiver({
                authenticatedUserId:
                  authenticatedUser.id,
                projectCreatedBy:
                  task.project.createdBy,
                projectAssignedTo:
                  task.project.assignedTo,
              }),
            projectId:
              task.project.id,
          };
        },
      );
    } catch (error) {
      if (
        isTransactionConflict(error)
      ) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_UPLOAD_CONFLICT",
          409,
        );
      }

      throw error;
    }

    storedFileKey = null;

    if (
      result.receiverId !== null &&
      result.receiverId !==
        authenticatedUserId
    ) {
      try {
        await notifyDocumentUploaded({
          userId:
            result.receiverId,
          fileName:
            storedFile.originalFileName,
          projectId:
            result.projectId,
        });
      } catch (error) {
        logger.error(
          "Project task attachment notification failed.",
          {
            taskId,
            projectId:
              result.projectId,
            receiverId:
              result.receiverId,
            attachmentId:
              result.attachment.id,
            error:
              error instanceof Error
                ? error
                : String(error),
          },
        );
      }
    }

    return result.attachment;
  } catch (error) {
    await removeProjectTaskAttachmentFile(
      storedFileKey,
      "r2",
      fileDependencies?.storage,
    );

    throw error;
  }
}
