import { TaskPriority } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;

const ALLOWED_PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

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

export async function POST(
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
    const projectId = parseId(
      id,
      "project id",
    );

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
      payload.priority ??
        TaskPriority.MEDIUM,
    ).trim() as TaskPriority;

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

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
          createdBy: true,
          assignedTo: true,
          tradeCaseId: true,
        },
      });

    if (!project) {
      throw new AppError(
        "PROJECT_NOT_FOUND",
        404,
      );
    }

    const isCustomer =
      project.createdBy === user.id;

    const isProvider =
      project.assignedTo === user.id;

    if (
      user.role !== "admin" &&
      !isCustomer &&
      !isProvider
    ) {
      throw new AppError(
        "PROJECT_TASK_CREATE_NOT_ALLOWED",
        403,
      );
    }

    const task =
      await prisma.$transaction(
        async (transaction) => {
          const createdTask =
            await transaction.projectTask.create({
              data: {
                projectId,
                title,
                description:
                  description || null,
                priority,
                startDate,
                dueDate,
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
                progress: true,
                estimatedHours: true,
                loggedHours: true,
                remainingHours: true,
                dependsOnId: true,
                completedAt: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          await transaction.caseActivity.create({
            data: {
              caseId:
                project.tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_CREATED",
              details: `Project task created: ${createdTask.title}`,
            },
          });

          return createdTask;
        },
      );

    return Response.json(
      {
        code: "PROJECT_TASK_CREATED",
        task,
      },
      {
        status: 201,
      },
    );
  });
}