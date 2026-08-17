import { AppError } from "../errors";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { removeProjectTaskAttachmentFile } from "../storage/project-task-attachment-storage";
import { canAccessProjectTaskAttachments } from "./project-task-attachment-permissions";
import type { SecureObjectStorage } from "../storage/secure-object-storage";

export async function deleteProjectTaskAttachment(input: { attachmentId: number; authenticatedUserId: number; objectStorage?: SecureObjectStorage }): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.authenticatedUserId }, select: { role: true } });
  const attachment = await prisma.projectTaskAttachment.findUnique({ where: { id: input.attachmentId }, select: { storageKey: true, storageProvider: true,
    task: { select: { project: { select: { createdBy: true, assignedTo: true } } } } } });
  if (!user || !attachment || !canAccessProjectTaskAttachments({ userId: input.authenticatedUserId, userRole: user.role,
    projectCreatedBy: attachment.task.project.createdBy, projectAssignedTo: attachment.task.project.assignedTo })) throw new AppError("PROJECT_TASK_ATTACHMENT_NOT_FOUND", 404);
  await prisma.projectTaskAttachment.delete({ where: { id: input.attachmentId } });
  await removeProjectTaskAttachmentFile(attachment.storageKey, attachment.storageProvider, input.objectStorage).catch((error: unknown) => logger.error("Deleted task attachment object cleanup failed.", { attachmentId: input.attachmentId, error: error instanceof Error ? error : String(error) }));
}
