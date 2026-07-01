import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    const body = await request.json();

    const content = String(body.content || "").trim();

    const parentId =
      body.parentId === "" || body.parentId === null || body.parentId === undefined
        ? null
        : Number(body.parentId);

    if (!content) {
      throw new AppError("Comment content is required.", 400);
    }

    if (parentId !== null && Number.isNaN(parentId)) {
      throw new AppError("Invalid parent comment.", 400);
    }

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
      throw new AppError("You are not allowed to comment on this task.", 403);
    }

    if (parentId !== null) {
      const parentComment = await prisma.projectTaskComment.findFirst({
        where: {
          id: parentId,
          taskId,
        },
        select: {
          id: true,
        },
      });

      if (!parentComment) {
        throw new AppError("Parent comment not found.", 404);
      }
    }

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.projectTaskComment.create({
        data: {
          taskId,
          authorId: user.id,
          content,
          parentId,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_COMMENT_CREATED",
          details: `Comment added to task: ${task.title}`,
        },
      });

      return createdComment;
    });

    return Response.json({
      message: "Comment created",
      comment,
    });
  });
}