import {
  Prisma,
  ProjectStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { calculateTaskProgress } from "../projectTaskProgress";
import { runInTransaction } from "../transactions";

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

export type ToggledProjectTaskChecklistItem =
  Prisma.ProjectTaskChecklistGetPayload<{
    select: typeof CHECKLIST_ITEM_SELECT;
  }>;

export type ToggleProjectTaskChecklistResult = {
  checklistItem: ToggledProjectTaskChecklistItem;
  taskProgress: number;
  projectProgress: number;
};

function ensureTogglePermission({
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
      "You are not allowed to update this checklist item.",
    );
  }
}

function calculateProjectProgress(
  tasks: readonly { progress: number }[],
): number {
  if (tasks.length === 0) {
    return 0;
  }

  const totalProgress = tasks.reduce(
    (sum, task) => sum + task.progress,
    0,
  );

  return Math.round(totalProgress / tasks.length);
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

  if (projectProgress === 100) {
    return ProjectStatus.COMPLETED;
  }

  return ProjectStatus.ACTIVE;
}

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function toggleProjectTaskChecklistItem({
  checklistItemId,
  authenticatedUserId,
}: {
  checklistItemId: number;
  authenticatedUserId: number;
}): Promise<ToggleProjectTaskChecklistResult> {
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

        const checklistItem =
          await transaction.projectTaskChecklist.findUnique({
            where: {
              id: checklistItemId,
            },
            select: {
              id: true,
              title: true,
              completed: true,
              task: {
                select: {
                  id: true,
                  status: true,
                  projectId: true,
                  checklistItems: {
                    select: {
                      id: true,
                      completed: true,
                    },
                  },
                  project: {
                    select: {
                      id: true,
                      status: true,
                      createdBy: true,
                      assignedTo: true,
                      tradeCaseId: true,
                    },
                  },
                },
              },
            },
          });

        if (!checklistItem) {
          throw AppError.notFound(
            "Project task checklist item was not found.",
          );
        }

        ensureTogglePermission({
          userId: authenticatedUser.id,
          userRole: authenticatedUser.role,
          projectCreatedBy:
            checklistItem.task.project.createdBy,
          projectAssignedTo:
            checklistItem.task.project.assignedTo,
        });

        const completed = !checklistItem.completed;
        const changedAt = new Date();

        const updatedChecklistItem =
          await transaction.projectTaskChecklist.update({
            where: {
              id: checklistItem.id,
            },
            data: {
              completed,
              completedAt: completed ? changedAt : null,
            },
            select: CHECKLIST_ITEM_SELECT,
          });

        const updatedChecklistItems =
          checklistItem.task.checklistItems.map((item) =>
            item.id === checklistItem.id
              ? {
                  ...item,
                  completed,
                }
              : item,
          );

        const taskProgress = calculateTaskProgress({
          status: checklistItem.task.status,
          checklistItems: updatedChecklistItems,
        });

        await transaction.projectTask.update({
          where: {
            id: checklistItem.task.id,
          },
          data: {
            progress: taskProgress,
          },
          select: {
            id: true,
          },
        });

        const projectTasks =
          await transaction.projectTask.findMany({
            where: {
              projectId: checklistItem.task.projectId,
            },
            select: {
              progress: true,
            },
          });

        const projectProgress =
          calculateProjectProgress(projectTasks);

        const nextProjectStatus = resolveProjectStatus({
          currentStatus:
            checklistItem.task.project.status,
          projectProgress,
        });

        await transaction.project.update({
          where: {
            id: checklistItem.task.project.id,
          },
          data: {
            progress: projectProgress,
            status: nextProjectStatus,
            completedAt:
              nextProjectStatus === ProjectStatus.COMPLETED
                ? changedAt
                : null,
          },
          select: {
            id: true,
          },
        });

        await transaction.caseActivity.create({
          data: {
            caseId:
              checklistItem.task.project.tradeCaseId,
            userId: authenticatedUser.id,
            action: "PROJECT_TASK_CHECKLIST_TOGGLED",
            details: JSON.stringify({
              checklistItemId: updatedChecklistItem.id,
              checklistItemTitle:
                updatedChecklistItem.title,
              taskId: checklistItem.task.id,
              projectId:
                checklistItem.task.project.id,
              previousCompleted:
                checklistItem.completed,
              completed: updatedChecklistItem.completed,
              taskProgress,
              projectProgress,
            }),
          },
        });

        return {
          checklistItem: updatedChecklistItem,
          taskProgress,
          projectProgress,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        maxRetries: 3,
      },
    );
  } catch (error) {
    if (isSerializationConflict(error)) {
      throw AppError.conflict(
        "The checklist item was changed by another request. Please try again.",
        {
          cause: error,
        },
      );
    }

    throw error;
  }
}
