import {
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";
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

    const status = String(
      (body as Record<string, unknown>)
        .status ?? "",
    ) as TaskStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      throw new AppError(
        "INVALID_TASK_STATUS",
        400,
      );
    }

    const task =
      await prisma.projectTask.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          projectId: true,
          project: {
            select: {
              createdBy: true,
              assignedTo: true,
              tradeCaseId: true,
            },
          },
          checklistItems: {
            select: {
              id: true,
              completed: true,
            },
          },
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
        "PROJECT_TASK_UPDATE_NOT_ALLOWED",
        403,
      );
    }

    if (task.status === status) {
      return Response.json({
        code: "PROJECT_TASK_STATUS_UNCHANGED",
        task: {
          id: task.id,
          status: task.status,
          progress: task.progress,
        },
      });
    }

    const requiresCompletedDependency =
      status === TaskStatus.IN_PROGRESS ||
      status === TaskStatus.REVIEW ||
      status === TaskStatus.COMPLETED;

    if (
      task.dependsOn &&
      task.dependsOn.status !==
        TaskStatus.COMPLETED &&
      requiresCompletedDependency
    ) {
      throw new AppError(
        "PROJECT_TASK_BLOCKED_BY_DEPENDENCY",
        400,
      );
    }

    const taskProgress =
      calculateTaskProgress({
        status,
        checklistItems:
          task.checklistItems,
      });

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const statusChangedAt =
            new Date();

          const updatedTask =
            await transaction.projectTask.update({
              where: {
                id: taskId,
              },
              data: {
                status,
                progress: taskProgress,
                completedAt:
                  status ===
                  TaskStatus.COMPLETED
                    ? statusChangedAt
                    : null,
              },
              select: {
                id: true,
                title: true,
                status: true,
                progress: true,
                completedAt: true,
                projectId: true,
              },
            });

          const allTasks =
            await transaction.projectTask.findMany({
              where: {
                projectId: task.projectId,
              },
              select: {
                progress: true,
              },
            });

          const projectProgress =
            allTasks.length === 0
              ? 0
              : Math.round(
                  allTasks.reduce(
                    (sum, item) =>
                      sum + item.progress,
                    0,
                  ) / allTasks.length,
                );

          const projectCompleted =
            projectProgress === 100;

          await transaction.project.update({
            where: {
              id: task.projectId,
            },
            data: {
              progress: projectProgress,
              status: projectCompleted
                ? ProjectStatus.COMPLETED
                : ProjectStatus.ACTIVE,
              completedAt: projectCompleted
                ? statusChangedAt
                : null,
            },
            select: {
              id: true,
            },
          });

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_STATUS_UPDATED",
              details: `Project task status updated: ${task.title} → ${status}`,
            },
          });

          return {
            task: updatedTask,
            projectProgress,
          };
        },
      );

    return Response.json({
      code: "PROJECT_TASK_STATUS_UPDATED",
      task: result.task,
      projectProgress:
        result.projectProgress,
    });
  });
}