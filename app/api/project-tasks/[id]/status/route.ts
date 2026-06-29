import { ProjectStatus, TaskStatus } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

const ALLOWED_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
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
    const status = String(body.status || "") as TaskStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      throw new AppError("Invalid task status.", 400);
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
      throw new AppError("You are not allowed to update this task.", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectTask.update({
        where: { id: taskId },
        data: {
          status,
          completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
        },
      });

      const totalTasks = await tx.projectTask.count({
        where: { projectId: task.projectId },
      });

      const completedTasks = await tx.projectTask.count({
        where: {
          projectId: task.projectId,
          status: TaskStatus.COMPLETED,
        },
      });

      const progress =
        totalTasks === 0
          ? 0
          : Math.round((completedTasks / totalTasks) * 100);

      await tx.project.update({
        where: { id: task.projectId },
        data: {
          progress,
          status:
            progress === 100
              ? ProjectStatus.COMPLETED
              : ProjectStatus.ACTIVE,
          completedAt: progress === 100 ? new Date() : null,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_STATUS_UPDATED",
          details: `Project task status updated: ${task.title} → ${status}`,
        },
      });
    });

    return Response.json({
      message: "Task status updated",
    });
  });
}