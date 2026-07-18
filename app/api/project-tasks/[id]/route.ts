import { TaskPriority } from "@prisma/client";
import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireUser } from "../../../../lib/auth";

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_TASK_HOURS = 100_000;

const ALLOWED_PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

function parseOptionalId(
  value: unknown,
  errorCode: string,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new AppError(errorCode, 400);
  }

  return parsedValue;
}

function parseDateOnly(
  value: unknown,
  errorCode: string,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(errorCode, 400);
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new AppError(errorCode, 400);
  }

  const [year, month, day] = text
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day, 12),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(errorCode, 400);
  }

  return date;
}

function parseHours(
  value: unknown,
  errorCode: string,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0 ||
    parsedValue > MAX_TASK_HOURS
  ) {
    throw new AppError(errorCode, 400);
  }

  return Math.round(parsedValue);
}

async function ensureNoCircularDependency(
  taskId: number,
  dependsOnId: number,
) {
  const visitedTaskIds = new Set<number>();
  let currentTaskId: number | null =
    dependsOnId;

  while (currentTaskId !== null) {
    if (currentTaskId === taskId) {
      throw new AppError(
        "PROJECT_TASK_CIRCULAR_DEPENDENCY",
        400,
      );
    }

    if (visitedTaskIds.has(currentTaskId)) {
      throw new AppError(
        "PROJECT_TASK_DEPENDENCY_CHAIN_INVALID",
        400,
      );
    }

    visitedTaskIds.add(currentTaskId);

   const dependencyTask:
  | {
      id: number;
      dependsOnId: number | null;
    }
  | null =
  await prisma.projectTask.findUnique({
    where: {
      id: currentTaskId,
    },
    select: {
      id: true,
      dependsOnId: true,
    },
  });

    if (!dependencyTask) {
      throw new AppError(
        "PROJECT_TASK_DEPENDENCY_NOT_FOUND",
        404,
      );
    }

    currentTaskId =
      dependencyTask.dependsOnId;
  }
}

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

    const payload = body as Record<
      string,
      unknown
    >;

    const title = String(
      payload.title ?? "",
    ).trim();

    const description = String(
      payload.description ?? "",
    ).trim();

    const priority = String(
      payload.priority ?? TaskPriority.MEDIUM,
    ) as TaskPriority;

    if (!title) {
      throw new AppError(
        "PROJECT_TASK_TITLE_REQUIRED",
        400,
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      throw new AppError(
        "PROJECT_TASK_TITLE_TOO_LONG",
        400,
      );
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      throw new AppError(
        "PROJECT_TASK_DESCRIPTION_TOO_LONG",
        400,
      );
    }

    if (
      !ALLOWED_PRIORITIES.includes(priority)
    ) {
      throw new AppError(
        "INVALID_TASK_PRIORITY",
        400,
      );
    }

    const startDate = parseDateOnly(
      payload.startDate,
      "INVALID_PROJECT_TASK_START_DATE",
    );

    const dueDate = parseDateOnly(
      payload.dueDate,
      "INVALID_PROJECT_TASK_DUE_DATE",
    );

    if (
      startDate &&
      dueDate &&
      startDate.getTime() >
        dueDate.getTime()
    ) {
      throw new AppError(
        "PROJECT_TASK_START_DATE_AFTER_DUE_DATE",
        400,
      );
    }

    const estimatedHours = parseHours(
      payload.estimatedHours,
      "INVALID_PROJECT_TASK_ESTIMATED_HOURS",
    );

    const loggedHours = parseHours(
      payload.loggedHours,
      "INVALID_PROJECT_TASK_LOGGED_HOURS",
    );

    const dependsOnId = parseOptionalId(
      payload.dependsOnId,
      "INVALID_PROJECT_TASK_DEPENDENCY_ID",
    );

    const assignedToId = parseOptionalId(
      payload.assignedToId,
      "INVALID_PROJECT_TASK_ASSIGNEE_ID",
    );

    if (dependsOnId === taskId) {
      throw new AppError(
        "PROJECT_TASK_CANNOT_DEPEND_ON_ITSELF",
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
          projectId: true,
          project: {
            select: {
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
        "PROJECT_TASK_UPDATE_NOT_ALLOWED",
        403,
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
          "PROJECT_TASK_ASSIGNEE_NOT_FOUND",
          404,
        );
      }
    }

    if (dependsOnId !== null) {
      const dependency =
        await prisma.projectTask.findUnique({
          where: {
            id: dependsOnId,
          },
          select: {
            id: true,
            projectId: true,
          },
        });

      if (!dependency) {
        throw new AppError(
          "PROJECT_TASK_DEPENDENCY_NOT_FOUND",
          404,
        );
      }

      if (
        dependency.projectId !==
        task.projectId
      ) {
        throw new AppError(
          "PROJECT_TASK_DEPENDENCY_PROJECT_MISMATCH",
          400,
        );
      }

      await ensureNoCircularDependency(
        taskId,
        dependsOnId,
      );
    }

    const remainingHours = Math.max(
      estimatedHours - loggedHours,
      0,
    );

    const updatedTask =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.projectTask.update({
              where: {
                id: taskId,
              },
              data: {
                title,
                description:
                  description || null,
                priority,
                startDate,
                dueDate,
                assignedToId,
                estimatedHours,
                loggedHours,
                remainingHours,
                dependsOnId,
              },
              select: {
                id: true,
                projectId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                startDate: true,
                dueDate: true,
                assignedToId: true,
                estimatedHours: true,
                loggedHours: true,
                remainingHours: true,
                dependsOnId: true,
                progress: true,
                completedAt: true,
                createdAt: true,
                updatedAt: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
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

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_UPDATED",
              details: `Project task updated: ${updated.title}`,
            },
          });

          return updated;
        },
      );

    return Response.json({
      code: "PROJECT_TASK_UPDATED",
      task: updatedTask,
    });
  });
}