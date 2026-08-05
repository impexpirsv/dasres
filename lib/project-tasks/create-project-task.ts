import {
  Prisma,
  TaskPriority,
} from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;

const ALLOWED_PRIORITIES =
  new Set<TaskPriority>([
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
  ]);

const CREATED_TASK_SELECT = {
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
} satisfies Prisma.ProjectTaskSelect;

export type CreatedProjectTask =
  Prisma.ProjectTaskGetPayload<{
    select: typeof CREATED_TASK_SELECT;
  }>;

export type CreateProjectTaskPayload = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  startDate: Date | null;
  dueDate: Date | null;
};

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  const contentType =
    request.headers.get(
      "content-type",
    );

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes(
        "application/json",
      )
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  try {
    return await request.json();
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
      400,
    );
  }
}

function parseRequiredString(
  value: unknown,
  {
    requiredCode,
    invalidCode,
    tooLongCode,
    maxLength,
  }: {
    requiredCode: string;
    invalidCode: string;
    tooLongCode: string;
    maxLength: number;
  },
): string {
  if (typeof value !== "string") {
    if (
      value === undefined ||
      value === null
    ) {
      throw new AppError(
        requiredCode,
        400,
      );
    }

    throw new AppError(
      invalidCode,
      400,
    );
  }

  const text = value.trim();

  if (!text) {
    throw new AppError(
      requiredCode,
      400,
    );
  }

  if (text.length > maxLength) {
    throw new AppError(
      tooLongCode,
      400,
    );
  }

  return text;
}

function parseOptionalString(
  value: unknown,
  {
    invalidCode,
    tooLongCode,
    maxLength,
  }: {
    invalidCode: string;
    tooLongCode: string;
    maxLength: number;
  },
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(
      invalidCode,
      400,
    );
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    throw new AppError(
      tooLongCode,
      400,
    );
  }

  return text;
}

function parsePriority(
  value: unknown,
): TaskPriority {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return TaskPriority.MEDIUM;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_TASK_PRIORITY",
      400,
    );
  }

  const priority =
    value.trim() as TaskPriority;

  if (
    !ALLOWED_PRIORITIES.has(
      priority,
    )
  ) {
    throw new AppError(
      "INVALID_TASK_PRIORITY",
      400,
    );
  }

  return priority;
}

function parseDateOnly(
  value: unknown,
  errorCode: string,
): Date | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(
      errorCode,
      400,
    );
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      text,
    )
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  const [year, month, day] =
    text.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    ),
  );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  return date;
}

function parseCreateTaskPayload(
  body: unknown,
): CreateProjectTaskPayload {
  if (!isPlainObject(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  const title =
    parseRequiredString(
      body.title,
      {
        requiredCode:
          "PROJECT_TASK_TITLE_REQUIRED",
        invalidCode:
          "INVALID_PROJECT_TASK_TITLE",
        tooLongCode:
          "PROJECT_TASK_TITLE_TOO_LONG",
        maxLength:
          MAX_TITLE_LENGTH,
      },
    );

  const description =
    parseOptionalString(
      body.description,
      {
        invalidCode:
          "INVALID_PROJECT_TASK_DESCRIPTION",
        tooLongCode:
          "PROJECT_TASK_DESCRIPTION_TOO_LONG",
        maxLength:
          MAX_DESCRIPTION_LENGTH,
      },
    );

  const priority =
    parsePriority(
      body.priority,
    );

  const startDate =
    parseDateOnly(
      body.startDate,
      "INVALID_PROJECT_TASK_START_DATE",
    );

  const dueDate =
    parseDateOnly(
      body.dueDate,
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

  return {
    title,
    description,
    priority,
    startDate,
    dueDate,
  };
}

export async function parseCreateProjectTaskPayload(
  request: Request,
): Promise<CreateProjectTaskPayload> {
  const body = await readJsonBody(
    request,
  );

  return parseCreateTaskPayload(
    body,
  );
}

function ensureTaskCreatePermission({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): void {
  const isAdmin =
    userRole === "admin";

  const isCustomer =
    projectCreatedBy === userId;

  const isProvider =
    projectAssignedTo === userId;

  if (
    !isAdmin &&
    !isCustomer &&
    !isProvider
  ) {
    throw new AppError(
      "PROJECT_TASK_CREATE_NOT_ALLOWED",
      403,
    );
  }
}

function mapCreateProjectTaskError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2034") {
      throw new AppError(
        "PROJECT_TASK_CREATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function createProjectTask({
  projectId,
  authenticatedUserId,
  payload,
}: {
  projectId: number;
  authenticatedUserId: number;
  payload: CreateProjectTaskPayload;
}): Promise<CreatedProjectTask> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: {
              id:
                authenticatedUserId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!authenticatedUser) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        const project =
          await transaction.project.findUnique({
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

        ensureTaskCreatePermission({
          userId:
            authenticatedUser.id,
          userRole:
            authenticatedUser.role,
          projectCreatedBy:
            project.createdBy,
          projectAssignedTo:
            project.assignedTo,
        });

        const createdTask =
          await transaction.projectTask.create({
            data: {
              projectId:
                project.id,
              title:
                payload.title,
              description:
                payload.description,
              priority:
                payload.priority,
              startDate:
                payload.startDate,
              dueDate:
                payload.dueDate,
            },
            select:
              CREATED_TASK_SELECT,
          });

        await transaction.caseActivity.create({
          data: {
            caseId:
              project.tradeCaseId,
            userId:
              authenticatedUser.id,
            action:
              "PROJECT_TASK_CREATED",
            details:
              JSON.stringify({
                taskId:
                  createdTask.id,
                projectId:
                  createdTask.projectId,
                title:
                  createdTask.title,
                priority:
                  createdTask.priority,
                status:
                  createdTask.status,
                startDate:
                  createdTask.startDate,
                dueDate:
                  createdTask.dueDate,
                createdBy:
                  authenticatedUser.id,
              }),
          },
        });

        return createdTask;
      },
    );
  } catch (error) {
    mapCreateProjectTaskError(
      error,
    );
  }
}
