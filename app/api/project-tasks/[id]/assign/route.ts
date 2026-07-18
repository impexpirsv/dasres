import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyTaskAssigned } from "../../../../../lib/notificationEvents";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const admin = await requireAdmin();

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

    const payload = body as Record<
      string,
      unknown
    >;

    let assignedToId: number | null = null;

    if (
      payload.assignedToId !== null &&
      payload.assignedToId !== undefined &&
      payload.assignedToId !== ""
    ) {
      assignedToId = Number(
        payload.assignedToId,
      );

      if (
        !Number.isInteger(assignedToId) ||
        assignedToId <= 0
      ) {
        throw new AppError(
          "INVALID_TASK_ASSIGNEE",
          400,
        );
      }
    }

    const task =
      await prisma.projectTask.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          assignedToId: true,
          project: {
            select: {
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

    if (assignedToId !== null) {
      const assignee =
        await prisma.user.findUnique({
          where: {
            id: assignedToId,
          },
          select: {
            id: true,
          },
        });

      if (!assignee) {
        throw new AppError(
          "TASK_ASSIGNEE_NOT_FOUND",
          404,
        );
      }
    }

    if (task.assignedToId === assignedToId) {
      return Response.json({
        code: "TASK_ASSIGNMENT_UNCHANGED",
      });
    }

    const updatedTask =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.projectTask.update({
              where: {
                id: taskId,
              },
              data: {
                assignedToId,
              },
              select: {
                id: true,
                title: true,
                projectId: true,
                assignedToId: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId: admin.id,
              action: "TASK_ASSIGNED",
              details: updated.assignedTo
                ? `Task "${task.title}" assigned to ${
                    updated.assignedTo
                      .name ||
                    updated.assignedTo
                      .email
                  }.`
                : `Task "${task.title}" was unassigned.`,
            },
          });

          return updated;
        },
      );

    if (updatedTask.assignedToId) {
      try {
        await notifyTaskAssigned({
          userId:
            updatedTask.assignedToId,
          taskTitle: task.title,
          projectId: task.projectId,
        });
      } catch (notificationError) {
        console.error(
          "TASK_ASSIGNMENT_NOTIFICATION_ERROR",
          {
            taskId: task.id,
            userId:
              updatedTask.assignedToId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "TASK_ASSIGNMENT_UPDATED",
      task: updatedTask,
    });
  });
}