import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyTaskAssigned } from "../notificationEvents";
import {
  runInTransaction,
  type TransactionClient,
} from "../transactions";

const TASK_ASSIGNMENT_SELECT = {
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
} satisfies Prisma.ProjectTaskSelect;

export type ProjectTaskAssignment =
  Prisma.ProjectTaskGetPayload<{
    select: typeof TASK_ASSIGNMENT_SELECT;
  }>;

export type AssignProjectTaskInput = {
  assignedToId: number | null;
};

type AssignmentResult = {
  task: ProjectTaskAssignment;
  changed: boolean;
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
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.validation(
      "Invalid project task assignee.",
      { field: "assignedToId" },
    );
  }

  return parsed;
}

export function parseAssignProjectTaskInput(
  body: unknown,
): AssignProjectTaskInput {
  if (!isRecord(body)) {
    throw AppError.badRequest(
      "Request body must be a JSON object.",
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      body,
      "assignedToId",
    )
  ) {
    throw AppError.validation(
      "Project task assignee is required.",
      { field: "assignedToId" },
    );
  }

  return {
    assignedToId: parseOptionalPositiveId(
      body.assignedToId,
    ),
  };
}

async function assertAdminInsideTransaction(
  transaction: TransactionClient,
  authenticatedUserId: number,
): Promise<void> {
  const user = await transaction.user.findUnique({
    where: { id: authenticatedUserId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw AppError.unauthenticated(
      "Authenticated user no longer exists.",
    );
  }

  if (user.role !== "admin") {
    throw AppError.unauthorized(
      "You are not allowed to assign project tasks.",
    );
  }
}

async function assertValidAssignee(
  transaction: TransactionClient,
  {
    assignedToId,
    projectCreatedBy,
    projectAssignedTo,
  }: {
    assignedToId: number | null;
    projectCreatedBy: number | null;
    projectAssignedTo: number | null;
  },
): Promise<void> {
  if (assignedToId === null) {
    return;
  }

  const participantIds = new Set<number>();

  if (projectCreatedBy !== null) {
    participantIds.add(projectCreatedBy);
  }

  if (projectAssignedTo !== null) {
    participantIds.add(projectAssignedTo);
  }

  if (!participantIds.has(assignedToId)) {
    throw AppError.validation(
      "The selected assignee is not a project participant.",
      { field: "assignedToId" },
    );
  }

  const assignee = await transaction.user.findUnique({
    where: { id: assignedToId },
    select: { id: true },
  });

  if (!assignee) {
    throw AppError.notFound(
      "Project task assignee was not found.",
    );
  }
}

function createActivityDetails({
  taskTitle,
  assignee,
}: {
  taskTitle: string;
  assignee: {
    name: string | null;
    email: string;
  } | null;
}): string {
  if (!assignee) {
    return `Task "${taskTitle}" was unassigned.`;
  }

  const assigneeLabel =
    assignee.name?.trim() || assignee.email;

  return `Task "${taskTitle}" assigned to ${assigneeLabel}.`;
}

export async function assignProjectTask({
  taskId,
  authenticatedUserId,
  input,
}: {
  taskId: number;
  authenticatedUserId: number;
  input: AssignProjectTaskInput;
}): Promise<AssignmentResult> {
  const result = await runInTransaction(
    async (transaction) => {
      await assertAdminInsideTransaction(
        transaction,
        authenticatedUserId,
      );

      const currentTask =
        await transaction.projectTask.findUnique({
          where: { id: taskId },
          select: {
            id: true,
            title: true,
            projectId: true,
            assignedToId: true,
            project: {
              select: {
                tradeCaseId: true,
                createdBy: true,
                assignedTo: true,
              },
            },
          },
        });

      if (!currentTask) {
        throw AppError.notFound(
          "Project task was not found.",
        );
      }

      await assertValidAssignee(transaction, {
        assignedToId: input.assignedToId,
        projectCreatedBy:
          currentTask.project.createdBy,
        projectAssignedTo:
          currentTask.project.assignedTo,
      });

      if (
        currentTask.assignedToId ===
        input.assignedToId
      ) {
        const unchangedTask =
          await transaction.projectTask.findUnique({
            where: { id: taskId },
            select: TASK_ASSIGNMENT_SELECT,
          });

        if (!unchangedTask) {
          throw AppError.notFound(
            "Project task was not found.",
          );
        }

        return {
          task: unchangedTask,
          changed: false,
        };
      }

      const task =
        await transaction.projectTask.update({
          where: { id: taskId },
          data: {
            assignedToId: input.assignedToId,
          },
          select: TASK_ASSIGNMENT_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId:
            currentTask.project.tradeCaseId,
          userId: authenticatedUserId,
          action:
            input.assignedToId === null
              ? "TASK_UNASSIGNED"
              : "TASK_ASSIGNED",
          details: createActivityDetails({
            taskTitle: task.title,
            assignee: task.assignedTo,
          }),
        },
      });

      return {
        task,
        changed: true,
      };
    },
  );

  if (
    result.changed &&
    result.task.assignedToId !== null
  ) {
    try {
      await notifyTaskAssigned({
        userId: result.task.assignedToId,
        taskTitle: result.task.title,
        projectId: result.task.projectId,
      });
    } catch (error) {
      logger.error(
        "Failed to send project task assignment notification.",
        {
          error:
            error instanceof Error
              ? error
              : String(error),
          taskId: result.task.id,
          projectId: result.task.projectId,
          userId: result.task.assignedToId,
        },
      );
    }
  }

  return result;
}
