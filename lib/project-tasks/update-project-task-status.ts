import {
  Prisma,
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { calculateTaskProgress } from "../projectTaskProgress";
import { runInTransaction } from "../transactions";

const ALLOWED_STATUSES = new Set<TaskStatus>([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
]);

const TASK_STATUS_SELECT = {
  id: true,
  title: true,
  status: true,
  progress: true,
  completedAt: true,
  projectId: true,
} satisfies Prisma.ProjectTaskSelect;

export type ProjectTaskStatusResult =
  Prisma.ProjectTaskGetPayload<{
    select: typeof TASK_STATUS_SELECT;
  }>;

export type ProjectTaskStatusUpdateResult = {
  task: ProjectTaskStatusResult;
  projectProgress: number;
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

export function parseProjectTaskStatusInput(
  body: unknown,
): TaskStatus {
  if (!isRecord(body)) {
    throw AppError.badRequest(
      "Request body must be a JSON object.",
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      body,
      "status",
    )
  ) {
    throw AppError.validation(
      "Project task status is required.",
      { field: "status" },
    );
  }

  if (typeof body.status !== "string") {
    throw AppError.validation(
      "Invalid project task status.",
      { field: "status" },
    );
  }

  const status = body.status.trim();

  if (
    !ALLOWED_STATUSES.has(
      status as TaskStatus,
    )
  ) {
    throw AppError.validation(
      "Invalid project task status.",
      { field: "status" },
    );
  }

  return status as TaskStatus;
}

function ensureUpdatePermission({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}) {
  const isAdmin = userRole === "admin";
  const isCustomer =
    projectCreatedBy === userId;
  const isProvider =
    projectAssignedTo === userId;

  if (
    !isAdmin &&
    !isCustomer &&
    !isProvider
  ) {
    throw AppError.unauthorized(
      "You are not allowed to update this project task.",
    );
  }
}

function ensureDependencyCompleted({
  nextStatus,
  dependency,
}: {
  nextStatus: TaskStatus;
  dependency: {
    id: number;
    status: TaskStatus;
  } | null;
}) {
  const needsCompletedDependency =
    nextStatus === TaskStatus.IN_PROGRESS ||
    nextStatus === TaskStatus.REVIEW ||
    nextStatus === TaskStatus.COMPLETED;

  if (
    needsCompletedDependency &&
    dependency &&
    dependency.status !==
      TaskStatus.COMPLETED
  ) {
    throw AppError.conflict(
      "The project task is blocked by an incomplete dependency.",
    );
  }
}

function ensureChecklistCompleted({
  nextStatus,
  checklistItems,
}: {
  nextStatus: TaskStatus;
  checklistItems: {
    completed: boolean;
  }[];
}) {
  if (
    nextStatus !== TaskStatus.COMPLETED
  ) {
    return;
  }

  const hasIncompleteItem =
    checklistItems.some(
      (item) => !item.completed,
    );

  if (hasIncompleteItem) {
    throw AppError.conflict(
      "All checklist items must be completed first.",
    );
  }
}

function calculateProjectProgress(
  tasks: {
    progress: number;
  }[],
) {
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
}) {
  if (
    currentStatus ===
      ProjectStatus.CANCELLED ||
    currentStatus === ProjectStatus.ON_HOLD
  ) {
    return currentStatus;
  }

  if (projectProgress === 100) {
    return ProjectStatus.COMPLETED;
  }

  return ProjectStatus.ACTIVE;
}

export async function updateProjectTaskStatus({
  taskId,
  nextStatus,
  authenticatedUserId,
}: {
  taskId: number;
  nextStatus: TaskStatus;
  authenticatedUserId: number;
}): Promise<ProjectTaskStatusUpdateResult> {
  return runInTransaction(
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

      ensureUpdatePermission({
        userId: authenticatedUser.id,
        userRole: authenticatedUser.role,
        projectCreatedBy:
          task.project.createdBy,
        projectAssignedTo:
          task.project.assignedTo,
      });

      if (task.status === nextStatus) {
        return {
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            progress: task.progress,
            completedAt:
              task.completedAt,
            projectId: task.projectId,
          },
          projectProgress:
            task.project.progress,
          changed: false,
        };
      }

      ensureDependencyCompleted({
        nextStatus,
        dependency: task.dependsOn,
      });

      ensureChecklistCompleted({
        nextStatus,
        checklistItems:
          task.checklistItems,
      });

      const statusChangedAt = new Date();

      const nextProgress =
        calculateTaskProgress({
          status: nextStatus,
          checklistItems:
            task.checklistItems,
        });

      const updatedTask =
        await transaction.projectTask.update({
          where: {
            id: task.id,
          },
          data: {
            status: nextStatus,
            progress: nextProgress,
            completedAt:
              nextStatus ===
              TaskStatus.COMPLETED
                ? statusChangedAt
                : null,
          },
          select: TASK_STATUS_SELECT,
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
              ? statusChangedAt
              : null,
        },
        select: {
          id: true,
        },
      });

      await transaction.caseActivity.create({
        data: {
          caseId:
            task.project.tradeCaseId,
          userId:
            authenticatedUser.id,
          action:
            "PROJECT_TASK_STATUS_UPDATED",
          details: JSON.stringify({
            taskId: task.id,
            taskTitle: task.title,
            previousStatus:
              task.status,
            newStatus: nextStatus,
            previousProgress:
              task.progress,
            newProgress: nextProgress,
            projectProgress,
          }),
        },
      });

      return {
        task: updatedTask,
        projectProgress,
        changed: true,
      };
    },
  );
}
