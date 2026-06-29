import { TaskPriority } from "@prisma/client";
import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireUser } from "../../../../lib/auth";

const ALLOWED_PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const priority = String(body.priority || "MEDIUM") as TaskPriority;
    const dueDateValue = String(body.dueDate || "").trim();

    const dueDate = dueDateValue ? new Date(dueDateValue) : null;

    if (dueDateValue && Number.isNaN(dueDate?.getTime())) {
      throw new AppError("Invalid due date.", 400);
    }
    if (!title) {
      throw new AppError("Task title is required.", 400);
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      throw new AppError("Invalid task priority.", 400);
    }

    const task = await prisma.projectTask.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new AppError("Task not found.", 404);
    }

    const isCustomer = task.project.createdBy === user.id;
    const isProvider = task.project.assignedTo === user.id;

    if (user.role !== "admin" && !isCustomer && !isProvider) {
      throw new AppError("You are not allowed to update this task.", 403);
    }

    const updatedTask = await prisma.projectTask.update({
      where: {
        id: taskId,
      },
      data: {
        title,
        description: description || null,
        priority,
        dueDate,
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: task.project.tradeCaseId,
        userId: user.id,
        action: "PROJECT_TASK_UPDATED",
        details: `Project task updated: ${updatedTask.title}`,
      },
    });

    return Response.json({
      message: "Task updated",
      task: updatedTask,
    });
  });
}
