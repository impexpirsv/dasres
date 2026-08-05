import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const MAX_CHECKLIST_TITLE_LENGTH = 300;

const CHECKLIST_ITEM_SELECT = {
  id: true,
  taskId: true,
  title: true,
  completed: true,
  completedAt: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectTaskChecklistSelect;

export type CreatedProjectTaskChecklistItem =
  Prisma.ProjectTaskChecklistGetPayload<{
    select:
      typeof CHECKLIST_ITEM_SELECT;
  }>;

export type CreateProjectTaskChecklistInput = {
  title: string;
};

function isRecord(
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

function parseInput(
  body: unknown,
): CreateProjectTaskChecklistInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  if (
    typeof body.title !==
    "string"
  ) {
    throw new AppError(
      "CHECKLIST_ITEM_TITLE_REQUIRED",
      400,
    );
  }

  const title =
    body.title.trim();

  if (!title) {
    throw new AppError(
      "CHECKLIST_ITEM_TITLE_REQUIRED",
      400,
    );
  }

  if (
    title.length >
    MAX_CHECKLIST_TITLE_LENGTH
  ) {
    throw new AppError(
      "CHECKLIST_ITEM_TITLE_TOO_LONG",
      400,
    );
  }

  return {
    title,
  };
}

export async function parseCreateProjectTaskChecklistInput(
  request: Request,
): Promise<CreateProjectTaskChecklistInput> {
  const body =
    await readJsonBody(request);

  return parseInput(body);
}

function ensureCreatePermission({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy:
    number | null;
  projectAssignedTo:
    number | null;
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
      "CHECKLIST_ITEM_CREATE_NOT_ALLOWED",
      403,
    );
  }
}

function mapCreateChecklistError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "CHECKLIST_ITEM_CREATE_CONFLICT",
      409,
    );
  }

  throw error;
}

export async function createProjectTaskChecklistItem({
  taskId,
  authenticatedUserId,
  input,
}: {
  taskId: number;
  authenticatedUserId: number;
  input:
    CreateProjectTaskChecklistInput;
}): Promise<CreatedProjectTaskChecklistItem> {
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

        const task =
          await transaction.projectTask.findUnique({
            where: {
              id: taskId,
            },
            select: {
              id: true,
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

        ensureCreatePermission({
          userId:
            authenticatedUser.id,
          userRole:
            authenticatedUser.role,
          projectCreatedBy:
            task.project.createdBy,
          projectAssignedTo:
            task.project.assignedTo,
        });

        const lastChecklistItem =
          await transaction.projectTaskChecklist.findFirst({
            where: {
              taskId: task.id,
            },
            orderBy: [
              {
                sortOrder:
                  "desc",
              },
              {
                id: "desc",
              },
            ],
            select: {
              sortOrder: true,
            },
          });

        const nextSortOrder =
          (lastChecklistItem?.sortOrder ??
            0) + 1;

        const checklistItem =
          await transaction.projectTaskChecklist.create({
            data: {
              taskId: task.id,
              title:
                input.title,
              sortOrder:
                nextSortOrder,
            },
            select:
              CHECKLIST_ITEM_SELECT,
          });

        await transaction.caseActivity.create({
          data: {
            caseId:
              task.project.tradeCaseId,
            userId:
              authenticatedUser.id,
            action:
              "PROJECT_TASK_CHECKLIST_CREATED",
            details:
              JSON.stringify({
                checklistItemId:
                  checklistItem.id,
                taskId:
                  task.id,
                projectId:
                  task.projectId,
                title:
                  checklistItem.title,
                sortOrder:
                  checklistItem.sortOrder,
                completed:
                  checklistItem.completed,
              }),
          },
        });

        return checklistItem;
      },
    );
  } catch (error) {
    mapCreateChecklistError(
      error,
    );
  }
}
