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
    const title = String(body.title || "").trim();

    if (!title) {
      throw new AppError("Checklist item title is required.", 400);
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
      throw new AppError("You are not allowed to add checklist items.", 403);
    }

    const checklistItem = await prisma.$transaction(async (tx) => {
      const count = await tx.projectTaskChecklist.count({
        where: { taskId },
      });

      const createdItem = await tx.projectTaskChecklist.create({
        data: {
          taskId,
          title,
          sortOrder: count + 1,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_CHECKLIST_CREATED",
          details: `Checklist item created: ${title}`,
        },
      });

      return createdItem;
    });

    return Response.json({
      message: "Checklist item created",
      checklistItem,
    });
  });
}