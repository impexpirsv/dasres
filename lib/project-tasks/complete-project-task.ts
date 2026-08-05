import {
  Prisma,
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";

import { createDomainEvent } from "../domain";
import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const COMPLETED_TASK_SELECT = {
  id: true,
  title: true,
  status: true,
  progress: true,
  completedAt: true,
  projectId: true,
} satisfies Prisma.ProjectTaskSelect;

export type CompletedProjectTask =
  Prisma.ProjectTaskGetPayload<{
    select: typeof COMPLETED_TASK_SELECT;
  }>;

export type ProjectTaskCompletedEvent = ReturnType<
  typeof createProjectTaskCompletedEvent
>;

export type CompleteProjectTaskResult = {
  task: CompletedProjectTask;
  projectProgress: number;
  changed: boolean;
  notificationReceiverId: number | null;
  event: ProjectTaskCompletedEvent | null;
};

function createProjectTaskCompletedEvent({
  task,
  actorId,
  previousStatus,
  previousProgress,
  projectProgress,
  occurredAt,
}: {
  task: CompletedProjectTask;
  actorId: number;
  previousStatus: TaskStatus;
  previousProgress: number;
  projectProgress: number;
  occurredAt: Date;
}) {
  return createDomainEvent({
    name: "project.task.completed",
    aggregateType: "ProjectTask",
    aggregateId: task.id,
    occurredAt,
    actor: {
      id: actorId,
      type: "User",
    },
    payload: {
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.projectId,
      previousStatus,
      previousProgress,
      newStatus: task.status,
      newProgress: task.progress,
      projectProgress,
    },
  });
}

function ensureCompletionPermission({
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
  const isAdmin = userRole === "admin";
  const isCustomer = projectCreatedBy === userId;
  const isProvider = projectAssignedTo === userId;

  if (!isAdmin && !isCustomer && !isProvider) {
    throw AppError.unauthorized(
      "You are not allowed to complete this project task.",
    );
  }
}

function ensureDependencyCompleted(
  dependency: {
    id: number;
    status: TaskStatus;
  } | null,
): void {
  if (
    dependency &&
    dependency.status !== TaskStatus.COMPLETED
  ) {
    throw AppError.conflict(
      "The project task is blocked by an incomplete dependency.",
      {
        details: {
          dependencyTaskId: dependency.id,
        },
      },
    );
  }
}

function ensureChecklistCompleted(
  checklistItems: readonly {
    completed: boolean;
  }[],
): void {
  if (
    checklistItems.some(
      (item) => !item.completed,
    )
  ) {
    throw AppError.conflict(
      "All checklist items must be completed first.",
    );
  }
}

function calculateProjectProgress(
  tasks: readonly {
    progress: number;
  }[],
): number {
  if (tasks.length === 0) {
    return 0;
  }

  const totalProgress = tasks.reduce(
    (sum, task) => sum + task.progress,
    0,
  );

  return Math.round(
    totalProgress / tasks.length,
  );
}

function resolveProjectStatus({
  currentStatus,
  projectProgress,
}: {
  currentStatus: ProjectStatus;
  projectProgress: number;
}): ProjectStatus {
  if (
    currentStatus === ProjectStatus.CANCELLED ||
    currentStatus === ProjectStatus.ON_HOLD
  ) {
    return currentStatus;
  }

  return projectProgress === 100
    ? ProjectStatus.COMPLETED
    : ProjectStatus.ACTIVE;
}

function resolveNotificationReceiver({
  authenticatedUserId,
  projectCreatedBy,
  projectAssignedTo,
}: {
  authenticatedUserId: number;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): number | null {
  if (projectCreatedBy === authenticatedUserId) {
    return projectAssignedTo;
  }

  if (projectAssignedTo === authenticatedUserId) {
    return projectCreatedBy;
  }

  return projectCreatedBy ?? projectAssignedTo;
}

function isTransactionConflict(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function completeProjectTask({
  taskId,
  authenticatedUserId,
}: {
  taskId: number;
  authenticatedUserId: number;
}): Promise<CompleteProjectTaskResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: {
              id: authenticatedUserId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!authenticatedUser) {
          throw AppError.unauthenticated(
            "Authenticated user no longer exists.",
          );
        }

        const task =
          await transaction.projectTask.findUnique({
            where: {
              id: taskId,
            },
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              completedAt: true,
              projectId: true,
              project: {
                select: {
                  status: true,
                  progress: true,
                  createdBy: true,
                  assignedTo: true,
                  tradeCaseId: true,
                },
              },
              checklistItems: {
                select: {
                  completed: true,
                },
              },
              dependsOn: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          });

        if (!task) {
          throw AppError.notFound(
            "Project task was not found.",
          );
        }

        ensureCompletionPermission({
          userId: authenticatedUser.id,
          userRole: authenticatedUser.role,
          projectCreatedBy:
            task.project.createdBy,
          projectAssignedTo:
            task.project.assignedTo,
        });

        const notificationReceiverId =
          resolveNotificationReceiver({
            authenticatedUserId:
              authenticatedUser.id,
            projectCreatedBy:
              task.project.createdBy,
            projectAssignedTo:
              task.project.assignedTo,
          });

        if (
          task.status === TaskStatus.COMPLETED
        ) {
          return {
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              progress: task.progress,
              completedAt: task.completedAt,
              projectId: task.projectId,
            },
            projectProgress:
              task.project.progress,
            changed: false,
            notificationReceiverId,
            event: null,
          };
        }

        ensureDependencyCompleted(
          task.dependsOn,
        );
        ensureChecklistCompleted(
          task.checklistItems,
        );

        const completedAt = new Date();
        const previousStatus = task.status;
        const previousProgress = task.progress;

        const updatedTask =
          await transaction.projectTask.update({
            where: {
              id: task.id,
            },
            data: {
              status: TaskStatus.COMPLETED,
              progress: 100,
              completedAt,
            },
            select: COMPLETED_TASK_SELECT,
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
          calculateProjectProgress(
            projectTasks,
          );

        const projectStatus =
          resolveProjectStatus({
            currentStatus:
              task.project.status,
            projectProgress,
          });

        await transaction.project.update({
          where: {
            id: task.projectId,
          },
          data: {
            progress: projectProgress,
            status: projectStatus,
            completedAt:
              projectStatus ===
              ProjectStatus.COMPLETED
                ? completedAt
                : null,
          },
          select: {
            id: true,
          },
        });

        const event =
          createProjectTaskCompletedEvent({
            task: updatedTask,
            actorId: authenticatedUser.id,
            previousStatus,
            previousProgress,
            projectProgress,
            occurredAt: completedAt,
          });

        await transaction.caseActivity.create({
          data: {
            caseId:
              task.project.tradeCaseId,
            userId: authenticatedUser.id,
            action:
              "PROJECT_TASK_COMPLETED",
            details: JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              ...event.payload,
            }),
          },
        });

        return {
          task: updatedTask,
          projectProgress,
          changed: true,
          notificationReceiverId,
          event,
        };
      },
    );
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw AppError.conflict(
        "The project task was changed concurrently. Please retry.",
        { cause: error },
      );
    }

    throw error;
  }
}
