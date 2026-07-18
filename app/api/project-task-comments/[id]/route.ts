import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireUser } from "../../../../lib/auth";

const MAX_COMMENT_LENGTH = 5000;

async function getAuthorizedComment(
  commentId: number,
) {
  const user = await requireUser();

  const comment =
    await prisma.projectTaskComment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        authorId: true,
        isDeleted: true,
        task: {
          select: {
            id: true,
            project: {
              select: {
                tradeCaseId: true,
              },
            },
          },
        },
      },
    });

  if (!comment) {
    throw new AppError(
      "COMMENT_NOT_FOUND",
      404,
    );
  }

  const isAuthor =
    comment.authorId === user.id;

  if (
    user.role !== "admin" &&
    !isAuthor
  ) {
    throw new AppError(
      "COMMENT_MANAGEMENT_NOT_ALLOWED",
      403,
    );
  }

  return {
    user,
    comment,
  };
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const { id } = await params;

    const commentId = parseId(
      id,
      "comment id",
    );

    const { user, comment } =
      await getAuthorizedComment(commentId);

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

    const content = String(
      (body as Record<string, unknown>)
        .content ?? "",
    ).trim();

    if (!content) {
      throw new AppError(
        "COMMENT_CONTENT_REQUIRED",
        400,
      );
    }

    if (
      content.length >
      MAX_COMMENT_LENGTH
    ) {
      throw new AppError(
        "COMMENT_CONTENT_TOO_LONG",
        400,
      );
    }

    if (comment.isDeleted) {
      throw new AppError(
        "DELETED_COMMENT_CANNOT_BE_EDITED",
        400,
      );
    }

    const updatedComment =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.projectTaskComment.update(
              {
                where: {
                  id: commentId,
                },
                data: {
                  content,
                  editedAt: new Date(),
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
                },
              },
            );

          await transaction.caseActivity.create({
            data: {
              caseId:
                comment.task.project
                  .tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_COMMENT_UPDATED",
              details:
                "Task comment updated.",
            },
          });

          return updated;
        },
      );

    return Response.json({
      code: "PROJECT_TASK_COMMENT_UPDATED",
      comment: updatedComment,
    });
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const { id } = await params;

    const commentId = parseId(
      id,
      "comment id",
    );

    const { user, comment } =
      await getAuthorizedComment(commentId);

    if (comment.isDeleted) {
      return Response.json({
        code: "PROJECT_TASK_COMMENT_ALREADY_DELETED",
      });
    }

    const deletedComment =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.projectTaskComment.update(
              {
                where: {
                  id: commentId,
                },
                data: {
                  isDeleted: true,
                  content:
                    "This comment was deleted.",
                  editedAt: new Date(),
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
                },
              },
            );

          await transaction.caseActivity.create({
            data: {
              caseId:
                comment.task.project
                  .tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_COMMENT_DELETED",
              details:
                "Task comment deleted.",
            },
          });

          return updated;
        },
      );

    return Response.json({
      code: "PROJECT_TASK_COMMENT_DELETED",
      comment: deletedComment,
    });
  });
}