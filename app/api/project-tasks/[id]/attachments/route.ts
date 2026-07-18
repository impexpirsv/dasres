import { randomUUID } from "crypto";
import {
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyDocumentUploaded } from "../../../../../lib/notificationEvents";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ORIGINAL_FILE_NAME_LENGTH = 255;

const UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "project-task-attachments",
);

const UPLOAD_URL_PREFIX =
  "/uploads/project-task-attachments/";

const FILE_TYPE_CONFIG: Record<
  string,
  {
    extensions: string[];
    storedExtension: string;
  }
> = {
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    storedExtension: ".jpg",
  },
  "image/png": {
    extensions: [".png"],
    storedExtension: ".png",
  },
  "image/webp": {
    extensions: [".webp"],
    storedExtension: ".webp",
  },
  "application/pdf": {
    extensions: [".pdf"],
    storedExtension: ".pdf",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    {
      extensions: [".docx"],
      storedExtension: ".docx",
    },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    {
      extensions: [".xlsx"],
      storedExtension: ".xlsx",
    },
};

function matchesFileSignature(
  buffer: Buffer,
  mimeType: string,
) {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") ===
        "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") ===
        "WEBP"
    );
  }

  if (mimeType === "application/pdf") {
    return (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString("ascii") ===
        "%PDF-"
    );
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  return false;
}

async function removeUploadedFile(
  filePath: string,
) {
  try {
    await unlink(filePath);
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error
        ? String(error.code)
        : null;

    if (errorCode !== "ENOENT") {
      console.error(
        "PROJECT_TASK_ATTACHMENT_FILE_CLEANUP_ERROR",
        {
          filePath,
          error,
        },
      );
    }
  }
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    let uploadedFilePath: string | null =
      null;

    try {
      const user = await requireUser();

      const { id } = await params;
      const taskId = parseId(id, "task id");

      const task =
        await prisma.projectTask.findUnique({
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

      const isCustomer =
        task.project.createdBy === user.id;

      const isProvider =
        task.project.assignedTo === user.id;

      if (
        user.role !== "admin" &&
        !isCustomer &&
        !isProvider
      ) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_UPLOAD_NOT_ALLOWED",
          403,
        );
      }

      let formData: FormData;

      try {
        formData = await request.formData();
      } catch {
        throw new AppError(
          "INVALID_FORM_DATA",
          400,
        );
      }

      const fileValue = formData.get("file");

      if (!(fileValue instanceof File)) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_REQUIRED",
          400,
        );
      }

      if (fileValue.size <= 0) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_EMPTY",
          400,
        );
      }

      if (fileValue.size > MAX_FILE_SIZE) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_TOO_LARGE",
          400,
        );
      }

      const fileTypeConfig =
        FILE_TYPE_CONFIG[fileValue.type];

      if (!fileTypeConfig) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_TYPE_NOT_ALLOWED",
          400,
        );
      }

      const originalFileName =
        fileValue.name
          .split(/[\\/]/)
          .pop()
          ?.trim() || "file";

      if (
        originalFileName.length >
        MAX_ORIGINAL_FILE_NAME_LENGTH
      ) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_NAME_TOO_LONG",
          400,
        );
      }

      const originalExtension = path
        .extname(originalFileName)
        .toLowerCase();

      if (
        !fileTypeConfig.extensions.includes(
          originalExtension,
        )
      ) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_EXTENSION_MISMATCH",
          400,
        );
      }

      const bytes =
        await fileValue.arrayBuffer();

      const buffer = Buffer.from(bytes);

      if (
        !matchesFileSignature(
          buffer,
          fileValue.type,
        )
      ) {
        throw new AppError(
          "PROJECT_TASK_ATTACHMENT_CONTENT_INVALID",
          400,
        );
      }

      await mkdir(UPLOAD_DIRECTORY, {
        recursive: true,
      });

      const storedFileName = `${taskId}-${randomUUID()}${fileTypeConfig.storedExtension}`;

      uploadedFilePath = path.join(
        UPLOAD_DIRECTORY,
        storedFileName,
      );

      await writeFile(
        uploadedFilePath,
        buffer,
        {
          flag: "wx",
        },
      );

      const fileUrl = `${UPLOAD_URL_PREFIX}${storedFileName}`;

      const attachment =
        await prisma.$transaction(
          async (transaction) => {
            const createdAttachment =
              await transaction.projectTaskAttachment.create(
                {
                  data: {
                    taskId,
                    fileName:
                      originalFileName,
                    fileUrl,
                    storageProvider:
                      "local",
                    mimeType:
                      fileValue.type,
                    fileSize:
                      fileValue.size,
                    uploadedById:
                      user.id,
                  },
                  select: {
                    id: true,
                    taskId: true,
                    fileName: true,
                    fileUrl: true,
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
                  },
                },
              );

            await transaction.caseActivity.create(
              {
                data: {
                  caseId:
                    task.project
                      .tradeCaseId,
                  userId: user.id,
                  action:
                    "PROJECT_TASK_ATTACHMENT_UPLOADED",
                  details: `Attachment uploaded: ${originalFileName}`,
                },
              },
            );

            return createdAttachment;
          },
        );

      uploadedFilePath = null;

      const receiverId =
        task.project.createdBy === user.id
          ? task.project.assignedTo
          : task.project.createdBy;

      if (
        receiverId &&
        receiverId !== user.id
      ) {
        try {
          await notifyDocumentUploaded({
            userId: receiverId,
            fileName: originalFileName,
            projectId: task.project.id,
          });
        } catch (notificationError) {
          console.error(
            "PROJECT_TASK_ATTACHMENT_NOTIFICATION_ERROR",
            {
              taskId,
              receiverId,
              attachmentId:
                attachment.id,
              error:
                notificationError,
            },
          );
        }
      }

      return Response.json(
        {
          code: "PROJECT_TASK_ATTACHMENT_UPLOADED",
          attachment,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      if (uploadedFilePath) {
        await removeUploadedFile(
          uploadedFilePath,
        );
      }

      throw error;
    }
  });
}