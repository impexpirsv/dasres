import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyDocumentUploaded } from "../../../../../lib/notificationEvents";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new AppError("Task not found.", 404);
    }

    const isCustomer = task.project.createdBy === user.id;
    const isProvider = task.project.assignedTo === user.id;

    if (user.role !== "admin" && !isCustomer && !isProvider) {
      throw new AppError(
        "You are not allowed to upload files to this task.",
        403,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("No file uploaded.", 400);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError("File type is not allowed.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError("File is too large. Maximum size is 10MB.", 400);
    }

    const originalFileName = file.name.split(/[\\/]/).pop() || "file";
    const extension = path.extname(originalFileName).toLowerCase();
    const storedFileName = `${taskId}-${Date.now()}-${crypto.randomUUID()}${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "project-task-attachments",
    );

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(path.join(uploadDir, storedFileName), buffer);

    const fileUrl = `/uploads/project-task-attachments/${storedFileName}`;

    const attachment = await prisma.$transaction(async (tx) => {
      const createdAttachment = await tx.projectTaskAttachment.create({
        data: {
          taskId,
          fileName: originalFileName,
          fileUrl,
          storageProvider: "local",
          mimeType: file.type,
          fileSize: file.size,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_ATTACHMENT_UPLOADED",
          details: `Attachment uploaded: ${originalFileName}`,
        },
      });
      const receiverId =
        task.project.createdBy === user.id
          ? task.project.assignedTo
          : task.project.createdBy;

      if (receiverId && receiverId !== user.id) {
       await notifyDocumentUploaded({
  userId: receiverId,
  fileName: originalFileName,
  projectId: task.project.id,
});
      }
      return createdAttachment;
    });

    return Response.json({
      message: "Attachment uploaded",
      attachment,
    });
  });
}
