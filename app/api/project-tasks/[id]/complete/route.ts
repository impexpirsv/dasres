import { ProjectStatus } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyTaskCompleted } from "../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

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
      throw new AppError("You are not allowed to complete this task.", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectTask.update({
        where: {
          id: taskId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      const totalTasks = await tx.projectTask.count({
        where: {
          projectId: task.projectId,
        },
      });

      const completedTasks = await tx.projectTask.count({
        where: {
          projectId: task.projectId,
          status: "COMPLETED",
        },
      });

      const progress =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      await tx.project.update({
        where: {
          id: task.projectId,
        },
        data: {
          progress,
          status:
            progress === 100 ? ProjectStatus.COMPLETED : ProjectStatus.ACTIVE,
          completedAt: progress === 100 ? new Date() : null,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_COMPLETED",
          details: `Project task completed: ${task.title}`,
        },
      });
      const receiverId =
        task.project.createdBy === user.id
          ? task.project.assignedTo
          : task.project.createdBy;

      if (receiverId && receiverId !== user.id) {
        await notifyTaskCompleted({
  userId: receiverId,
  taskTitle: task.title,
  projectId: task.projectId,
});
      }
    });

    return Response.json({
      message: "Task completed",
    });
  });
}
