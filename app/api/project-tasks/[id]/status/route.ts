import { ProjectStatus, TaskStatus } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { calculateTaskProgress } from "../../../../../lib/projectTaskProgress";

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
      include: {
        project: true,
        checklistItems: true,
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
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

    const isTryingToStartOrComplete =
      status === TaskStatus.IN_PROGRESS ||
      status === TaskStatus.REVIEW ||
      status === TaskStatus.COMPLETED;

    if (
      task.dependsOn &&
      task.dependsOn.status !== TaskStatus.COMPLETED &&
      isTryingToStartOrComplete
    ) {
      throw new AppError(
        `This task is blocked by "${task.dependsOn.title}".`,
        400,
      );
    }

    const taskProgress = calculateTaskProgress({
      ...task,
      status,
    });

    await prisma.$transaction(async (tx) => {
      await tx.projectTask.update({
        where: { id: taskId },
        data: {
          status,
          progress: taskProgress,
          completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
        },
      });

      const allTasks = await tx.projectTask.findMany({
        where: { projectId: task.projectId },
        select: {
          progress: true,
        },
      });

      const projectProgress =
        allTasks.length === 0
          ? 0
          : Math.round(
              allTasks.reduce((sum, item) => sum + item.progress, 0) /
                allTasks.length,
            );

      await tx.project.update({
        where: { id: task.projectId },
        data: {
          progress: projectProgress,
          status:
            projectProgress === 100
              ? ProjectStatus.COMPLETED
              : ProjectStatus.ACTIVE,
          completedAt: projectProgress === 100 ? new Date() : null,
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