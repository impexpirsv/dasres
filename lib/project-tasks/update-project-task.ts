import {
  Prisma,
  TaskPriority,
} from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import {
  runInTransaction,
  type TransactionClient,
} from "../transactions";

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_TASK_HOURS = 100_000;

const ALLOWED_PRIORITIES = new Set<TaskPriority>(
  Object.values(TaskPriority),
);

const UPDATED_TASK_SELECT = {
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
} satisfies Prisma.ProjectTaskSelect;

export type UpdatedProjectTask =
  Prisma.ProjectTaskGetPayload<{
    select: typeof UPDATED_TASK_SELECT;
  }>;

export type UpdateProjectTaskInput = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  loggedHours: number;
  assignedToId: number | null;
  dependsOnId: number | null;
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

function parseOptionalPositiveId(
  value: unknown,
  fieldName: string,
): number | null {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.validation(
      `Invalid ${fieldName}.`,
      { field: fieldName },
    );
  }

  return parsed;
}

function parseDateOnly(
  value: unknown,
  fieldName: string,
): Date | null {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())
  ) {
    throw AppError.validation(
      `Invalid ${fieldName}.`,
      { field: fieldName },
    );
  }

  const [year, month, day] = value
    .trim()
    .split("-")
    .map(Number);

  const parsed = new Date(
    Date.UTC(year, month - 1, day, 12),
  );

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw AppError.validation(
      `Invalid ${fieldName}.`,
      { field: fieldName },
    );
  }

  return parsed;
}

function parseHours(
  value: unknown,
  fieldName: string,
  nullable: boolean,
): number | null {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return nullable ? null : 0;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    parsed > MAX_TASK_HOURS
  ) {
    throw AppError.validation(
      `Invalid ${fieldName}.`,
      { field: fieldName },
    );
  }

  return Math.round(parsed);
}

export function parseUpdateProjectTaskInput(
  body: unknown,
): UpdateProjectTaskInput {
  if (!isRecord(body)) {
    throw AppError.badRequest(
      "Request body must be a JSON object.",
    );
  }

  if (typeof body.title !== "string") {
    throw AppError.validation(
      "Project task title is required.",
      { field: "title" },
    );
  }

  const title = body.title.trim();

  if (!title) {
    throw AppError.validation(
      "Project task title is required.",
      { field: "title" },
    );
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw AppError.validation(
      "Project task title is too long.",
      {
        field: "title",
        maxLength: MAX_TITLE_LENGTH,
      },
    );
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw AppError.validation(
      "Project task description must be a string.",
      { field: "description" },
    );
  }

  const normalizedDescription =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  if (
    normalizedDescription.length >
    MAX_DESCRIPTION_LENGTH
  ) {
    throw AppError.validation(
      "Project task description is too long.",
      {
        field: "description",
        maxLength: MAX_DESCRIPTION_LENGTH,
      },
    );
  }

  const priorityValue =
    body.priority ?? TaskPriority.MEDIUM;

  if (
    typeof priorityValue !== "string" ||
    !ALLOWED_PRIORITIES.has(
      priorityValue as TaskPriority,
    )
  ) {
    throw AppError.validation(
      "Invalid project task priority.",
      { field: "priority" },
    );
  }

  const startDate = parseDateOnly(
    body.startDate,
    "startDate",
  );
  const dueDate = parseDateOnly(
    body.dueDate,
    "dueDate",
  );

  if (
    startDate &&
    dueDate &&
    startDate.getTime() > dueDate.getTime()
  ) {
    throw AppError.validation(
      "Project task start date cannot be after its due date.",
      { fields: ["startDate", "dueDate"] },
    );
  }

  return {
    title,
    description: normalizedDescription || null,
    priority: priorityValue as TaskPriority,
    startDate,
    dueDate,
    estimatedHours: parseHours(
      body.estimatedHours,
      "estimatedHours",
      true,
    ),
    loggedHours:
      parseHours(
        body.loggedHours,
        "loggedHours",
        false,
      ) ?? 0,
    assignedToId: parseOptionalPositiveId(
      body.assignedToId,
      "assignedToId",
    ),
    dependsOnId: parseOptionalPositiveId(
      body.dependsOnId,
      "dependsOnId",
    ),
  };
}

function assertProjectTaskUpdatePermission({
  userId,
  role,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  role: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): void {
  if (
    role !== "admin" &&
    projectCreatedBy !== userId &&
    projectAssignedTo !== userId
  ) {
    throw AppError.unauthorized(
      "You cannot update this project task.",
    );
  }
}

async function assertValidAssignee(
  transaction: TransactionClient,
  assignedToId: number | null,
  projectCreatedBy: number | null,
  projectAssignedTo: number | null,
): Promise<void> {
  if (assignedToId === null) {
    return;
  }

  const projectParticipantIds = new Set(
    [projectCreatedBy, projectAssignedTo].filter(
      (id): id is number => id !== null,
    ),
  );

  if (!projectParticipantIds.has(assignedToId)) {
    throw AppError.validation(
      "The assignee must be a project participant.",
      { field: "assignedToId" },
    );
  }

  const assignee = await transaction.user.findUnique({
    where: { id: assignedToId },
    select: { id: true },
  });

  if (!assignee) {
    throw AppError.notFound("Assignee not found.");
  }
}

async function assertValidDependency(
  transaction: TransactionClient,
  taskId: number,
  projectId: number,
  dependsOnId: number | null,
): Promise<void> {
  if (dependsOnId === null) {
    return;
  }

  if (dependsOnId === taskId) {
    throw AppError.validation(
      "A project task cannot depend on itself.",
      { field: "dependsOnId" },
    );
  }

  const visited = new Set<number>();
  let currentId: number | null = dependsOnId;

  while (currentId !== null) {
    if (currentId === taskId) {
      throw AppError.validation(
        "The selected dependency creates a circular dependency.",
        { field: "dependsOnId" },
      );
    }

    if (visited.has(currentId)) {
      throw AppError.conflict(
        "The existing project task dependency chain is invalid.",
      );
    }

    visited.add(currentId);

    const dependency: {
      projectId: number;
      dependsOnId: number | null;
    } | null =
      await transaction.projectTask.findUnique({
        where: { id: currentId },
        select: {
          projectId: true,
          dependsOnId: true,
        },
      });

    if (!dependency) {
      throw AppError.notFound(
        "Dependency project task not found.",
      );
    }

    if (dependency.projectId !== projectId) {
      throw AppError.validation(
        "A dependency must belong to the same project.",
        { field: "dependsOnId" },
      );
    }

    currentId = dependency.dependsOnId;
  }
}

function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function updateProjectTask({
  taskId,
  authenticatedUserId,
  input,
}: {
  taskId: number;
  authenticatedUserId: number;
  input: UpdateProjectTaskInput;
}): Promise<UpdatedProjectTask> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: { id: authenticatedUserId },
            select: {
              id: true,
              role: true,
            },
          });

        if (!authenticatedUser) {
          throw AppError.unauthenticated(
            "Authenticated user not found.",
          );
        }

        const task =
          await transaction.projectTask.findUnique({
            where: { id: taskId },
            select: {
              id: true,
              projectId: true,
              title: true,
              description: true,
              priority: true,
              startDate: true,
              dueDate: true,
              assignedToId: true,
              estimatedHours: true,
              loggedHours: true,
              remainingHours: true,
              dependsOnId: true,
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
          throw AppError.notFound(
            "Project task not found.",
          );
        }

        assertProjectTaskUpdatePermission({
          userId: authenticatedUser.id,
          role: authenticatedUser.role,
          projectCreatedBy: task.project.createdBy,
          projectAssignedTo: task.project.assignedTo,
        });

        await assertValidAssignee(
          transaction,
          input.assignedToId,
          task.project.createdBy,
          task.project.assignedTo,
        );

        await assertValidDependency(
          transaction,
          task.id,
          task.projectId,
          input.dependsOnId,
        );

        const remainingHours = Math.max(
          (input.estimatedHours ?? 0) -
            input.loggedHours,
          0,
        );

        const updatedTask =
          await transaction.projectTask.update({
            where: { id: task.id },
            data: {
              title: input.title,
              description: input.description,
              priority: input.priority,
              startDate: input.startDate,
              dueDate: input.dueDate,
              assignedToId: input.assignedToId,
              estimatedHours: input.estimatedHours,
              loggedHours: input.loggedHours,
              remainingHours,
              dependsOnId: input.dependsOnId,
            },
            select: UPDATED_TASK_SELECT,
          });

        await transaction.caseActivity.create({
          data: {
            caseId: task.project.tradeCaseId,
            userId: authenticatedUser.id,
            action: "PROJECT_TASK_UPDATED",
            details: JSON.stringify({
              taskId: task.id,
              previous: {
                title: task.title,
                description: task.description,
                priority: task.priority,
                startDate: task.startDate,
                dueDate: task.dueDate,
                assignedToId: task.assignedToId,
                estimatedHours: task.estimatedHours,
                loggedHours: task.loggedHours,
                remainingHours: task.remainingHours,
                dependsOnId: task.dependsOnId,
              },
              current: {
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                startDate: updatedTask.startDate,
                dueDate: updatedTask.dueDate,
                assignedToId: updatedTask.assignedToId,
                estimatedHours: updatedTask.estimatedHours,
                loggedHours: updatedTask.loggedHours,
                remainingHours: updatedTask.remainingHours,
                dependsOnId: updatedTask.dependsOnId,
              },
            }),
          },
        });

        return updatedTask;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,
        maxRetries: 3,
      },
      prisma,
    );
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw AppError.conflict(
        "The project task changed concurrently. Please retry.",
      );
    }

    throw error;
  }
}
