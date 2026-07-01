import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireUser } from "../../../../lib/auth";

async function getAuthorizedComment(commentId: number) {
  const user = await requireUser();

  const comment = await prisma.projectTaskComment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      task: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!comment) {
    throw new AppError("Comment not found.", 404);
  }

  const isAuthor = comment.authorId === user.id;
  const isCustomer = comment.task.project.createdBy === user.id;
  const isProvider = comment.task.project.assignedTo === user.id;

  if (
    user.role !== "admin" &&
    !isAuthor &&
    !isCustomer &&
    !isProvider
  ) {
    throw new AppError("You are not allowed to manage this comment.", 403);
  }

  return {
    user,
    comment,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const { id } = await params;
    const commentId = parseId(id, "comment id");

    const { user, comment } = await getAuthorizedComment(commentId);

    const body = await request.json();
    const content = String(body.content || "").trim();

    if (!content) {
      throw new AppError("Comment content is required.", 400);
    }

    if (comment.isDeleted) {
      throw new AppError("Deleted comments cannot be edited.", 400);
    }

    const updatedComment =
      await prisma.projectTaskComment.update({
        where: {
          id: commentId,
        },
        data: {
          content,
          editedAt: new Date(),
        },
      });

    await prisma.caseActivity.create({
      data: {
        caseId: comment.task.project.tradeCaseId,
        userId: user.id,
        action: "PROJECT_TASK_COMMENT_UPDATED",
        details: "Task comment updated.",
      },
    });

    return Response.json({
      message: "Comment updated",
      comment: updatedComment,
    });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const { id } = await params;
    const commentId = parseId(id, "comment id");

    const { user, comment } = await getAuthorizedComment(commentId);

    if (comment.isDeleted) {
      return Response.json({
        message: "Comment already deleted",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectTaskComment.update({
        where: {
          id: commentId,
        },
        data: {
          isDeleted: true,
          content: "This comment was deleted.",
          editedAt: new Date(),
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: comment.task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_COMMENT_DELETED",
          details: "Task comment deleted.",
        },
      });
    });

    return Response.json({
      message: "Comment deleted",
    });
  });
}