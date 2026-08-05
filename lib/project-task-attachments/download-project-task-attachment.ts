import { AppError } from "../errors";
import { prisma } from "../prisma";
import { readProjectTaskAttachmentFile } from "../storage/project-task-attachment-storage";
import { createPrivateDownloadResponse } from "../storage/private-download-response";
import { canAccessProjectTaskAttachments } from "./project-task-attachment-permissions";

export async function downloadProjectTaskAttachment({
  attachmentId,
  authenticatedUserId,
}: {
  attachmentId: number;
  authenticatedUserId: number;
}): Promise<Response> {
  const [user, attachment] = await Promise.all([
    prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { id: true, role: true } }),
    prisma.projectTaskAttachment.findUnique({
      where: { id: attachmentId },
      select: {
        fileName: true,
        storageKey: true,
        mimeType: true,
        task: { select: { project: { select: { createdBy: true, assignedTo: true } } } },
      },
    }),
  ]);

  if (!user || !attachment || !canAccessProjectTaskAttachments({
    userId: authenticatedUserId,
    userRole: user.role,
    projectCreatedBy: attachment.task.project.createdBy,
    projectAssignedTo: attachment.task.project.assignedTo,
  })) {
    throw new AppError("PROJECT_TASK_ATTACHMENT_NOT_FOUND", 404);
  }

  const file = await readProjectTaskAttachmentFile(attachment.storageKey);
  return createPrivateDownloadResponse({
    bytes: file.bytes,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType || "application/octet-stream",
  });
}
