import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyTaskComment } from "../../../../../lib/notificationEvents";

const MAX_COMMENT_LENGTH = 5000;

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "INVALID_JSON_BODY",
        400,
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
      );
    }

    const payload = body as Record<
      string,
      unknown
    >;

    const content = String(
      payload.content ?? "",
    ).trim();

    if (!content) {
      throw new AppError(
        "COMMENT_CONTENT_REQUIRED",
        400,
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      throw new AppError(
        "COMMENT_CONTENT_TOO_LONG",
        400,
      );
    }

    let parentId: number | null = null;

    if (
      payload.parentId !== "" &&
      payload.parentId !== null &&
      payload.parentId !== undefined
    ) {
      parentId = Number(payload.parentId);

      if (
        !Number.isInteger(parentId) ||
        parentId <= 0
      ) {
        throw new AppError(
          "INVALID_PARENT_COMMENT_ID",
          400,
        );
      }
    }

    const task =
      await prisma.projectTask.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          title: true,
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
        "PROJECT_TASK_COMMENT_CREATE_NOT_ALLOWED",
        403,
      );
    }

    if (parentId !== null) {
      const parentComment =
        await prisma.projectTaskComment.findFirst({
          where: {
            id: parentId,
            taskId,
            isDeleted: false,
          },
          select: {
            id: true,
          },
        });

      if (!parentComment) {
        throw new AppError(
          "PARENT_COMMENT_NOT_FOUND",
          404,
        );
      }
    }

    const comment =
      await prisma.$transaction(
        async (transaction) => {
          const createdComment =
            await transaction.projectTaskComment.create(
              {
                data: {
                  taskId,
                  authorId: user.id,
                  content,
                  parentId,
                },
                select: {
                  id: true,
                  taskId: true,
                  authorId: true,
                  parentId: true,
                  content: true,
                  isDeleted: true,
                  editedAt: true,
                  createdAt: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            );

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_COMMENT_CREATED",
              details: `Comment added to task: ${task.title}`,
            },
          });

          return createdComment;
        },
      );

    const receiverId =
      task.project.createdBy === user.id
        ? task.project.assignedTo
        : task.project.createdBy;

    if (
      receiverId &&
      receiverId !== user.id
    ) {
      try {
        await notifyTaskComment({
          userId: receiverId,
          taskTitle: task.title,
          projectId: task.projectId,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_TASK_COMMENT_NOTIFICATION_ERROR",
          {
            taskId: task.id,
            commentId: comment.id,
            receiverId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json(
      {
        code: "PROJECT_TASK_COMMENT_CREATED",
        comment,
      },
      {
        status: 201,
      },
    );
  });
}