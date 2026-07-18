import {
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyTaskCompleted } from "../../../../../lib/notificationEvents";

export async function PATCH(
  _request: Request,
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

    const task =
      await prisma.projectTask.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          title: true,
          status: true,
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
        "PROJECT_TASK_COMPLETE_NOT_ALLOWED",
        403,
      );
    }

    if (
      task.status ===
      TaskStatus.COMPLETED
    ) {
      return Response.json({
        code: "PROJECT_TASK_ALREADY_COMPLETED",
      });
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const completedAt = new Date();

        const updatedTask =
          await transaction.projectTask.update({
            where: {
              id: taskId,
            },
            data: {
              status:
                TaskStatus.COMPLETED,
              progress: 100,
              completedAt,
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

        const projectTasks =
          await transaction.projectTask.findMany({
            where: {
              projectId: task.projectId,
            },
            select: {
              progress: true,
            },
          });

        const projectProgress =
          projectTasks.length === 0
            ? 0
            : Math.round(
                projectTasks.reduce(
                  (sum, projectTask) =>
                    sum +
                    projectTask.progress,
                  0,
                ) /
                  projectTasks.length,
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
              ? completedAt
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
              "PROJECT_TASK_COMPLETED",
            details: `Project task completed: ${task.title}`,
          },
        });

        return {
          task: updatedTask,
          projectProgress,
        };
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
        await notifyTaskCompleted({
          userId: receiverId,
          taskTitle: task.title,
          projectId: task.projectId,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_TASK_COMPLETED_NOTIFICATION_ERROR",
          {
            taskId: task.id,
            receiverId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "PROJECT_TASK_COMPLETED",
      task: result.task,
      projectProgress:
        result.projectProgress,
    });
  });
}