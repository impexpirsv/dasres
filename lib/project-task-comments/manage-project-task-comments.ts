import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const MAX_COMMENT_LENGTH = 5_000;

const COMMENT_SELECT = {
  id: true,
  taskId: true,
  authorId: true,
  parentId: true,
  content: true,
  isDeleted: true,
  editedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectTaskCommentSelect;

export type ProjectTaskComment =
  Prisma.ProjectTaskCommentGetPayload<{
    select: typeof COMMENT_SELECT;
  }>;

export type CreateProjectTaskCommentInput = {
  content: string;
  parentId: number | null;
};

export type UpdateProjectTaskCommentInput = {
  content: string;
};

export type CreateProjectTaskCommentResult = {
  comment: ProjectTaskComment;
  receiverId: number | null;
  taskTitle: string;
  projectId: number;
};

export type DeleteProjectTaskCommentResult = {
  comment: ProjectTaskComment | null;
  alreadyDeleted: boolean;
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

function parseOptionalPositiveInteger(
  value: unknown,
  errorCode: string,
): number | null {
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

function parseCommentContent(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new AppError(
      "COMMENT_CONTENT_REQUIRED",
      400,
    );
  }

  const content = value.trim();

  if (!content) {
    throw new AppError(
      "COMMENT_CONTENT_REQUIRED",
      400,
    );
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    throw new AppError(
      "COMMENT_CONTENT_TOO_LONG",
      400,
    );
  }

  return content;
}

export function parseCreateProjectTaskCommentInput(
  body: unknown,
): CreateProjectTaskCommentInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return {
    content: parseCommentContent(body.content),
    parentId: parseOptionalPositiveInteger(
      body.parentId,
      "INVALID_PARENT_COMMENT_ID",
    ),
  };
}

export function parseUpdateProjectTaskCommentInput(
  body: unknown,
): UpdateProjectTaskCommentInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return {
    content: parseCommentContent(body.content),
  };
}

function ensureProjectCommentPermission({
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
    throw new AppError(
      "PROJECT_TASK_COMMENT_CREATE_NOT_ALLOWED",
      403,
    );
  }
}

function ensureCommentManagementPermission({
  authenticatedUserId,
  authenticatedUserRole,
  commentAuthorId,
}: {
  authenticatedUserId: number;
  authenticatedUserRole: string;
  commentAuthorId: number | null;
}): void {
  const isAdmin = authenticatedUserRole === "admin";
  const isAuthor =
    commentAuthorId === authenticatedUserId;

  if (!isAdmin && !isAuthor) {
    throw new AppError(
      "COMMENT_MANAGEMENT_NOT_ALLOWED",
      403,
    );
  }
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

async function executeCommentTransaction<T>(
  operation: (
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
  conflictCode: string,
): Promise<T> {
  try {
    return await runInTransaction(operation);
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw new AppError(conflictCode, 409);
    }

    throw error;
  }
}

export async function createProjectTaskComment({
  taskId,
  authenticatedUserId,
  input,
}: {
  taskId: number;
  authenticatedUserId: number;
  input: CreateProjectTaskCommentInput;
}): Promise<CreateProjectTaskCommentResult> {
  return executeCommentTransaction(
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

      ensureProjectCommentPermission({
        userId: authenticatedUser.id,
        userRole: authenticatedUser.role,
        projectCreatedBy:
          task.project.createdBy,
        projectAssignedTo:
          task.project.assignedTo,
      });

      if (input.parentId !== null) {
        const parentComment =
          await transaction.projectTaskComment.findFirst({
            where: {
              id: input.parentId,
              taskId: task.id,
              isDeleted: false,
            },
            select: {
              id: true,
              parentId: true,
            },
          });

        if (!parentComment) {
          throw new AppError(
            "PARENT_COMMENT_NOT_FOUND",
            404,
          );
        }

        if (parentComment.parentId !== null) {
          throw new AppError(
            "NESTED_COMMENT_REPLY_NOT_ALLOWED",
            400,
          );
        }
      }

      const comment =
        await transaction.projectTaskComment.create({
          data: {
            taskId: task.id,
            authorId: authenticatedUser.id,
            content: input.content,
            parentId: input.parentId,
          },
          select: COMMENT_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId: task.project.tradeCaseId,
          userId: authenticatedUser.id,
          action:
            "PROJECT_TASK_COMMENT_CREATED",
          details: JSON.stringify({
            commentId: comment.id,
            taskId: task.id,
            projectId: task.projectId,
            parentId: comment.parentId,
            authorId: comment.authorId,
            contentLength: comment.content.length,
          }),
        },
      });

      return {
        comment,
        receiverId:
          resolveNotificationReceiver({
            authenticatedUserId:
              authenticatedUser.id,
            projectCreatedBy:
              task.project.createdBy,
            projectAssignedTo:
              task.project.assignedTo,
          }),
        taskTitle: task.title,
        projectId: task.projectId,
      };
    },
    "PROJECT_TASK_COMMENT_CREATE_CONFLICT",
  );
}

export async function updateProjectTaskComment({
  commentId,
  authenticatedUserId,
  input,
}: {
  commentId: number;
  authenticatedUserId: number;
  input: UpdateProjectTaskCommentInput;
}): Promise<ProjectTaskComment> {
  return executeCommentTransaction(
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
        throw new AppError(
          "AUTHENTICATED_USER_NOT_FOUND",
          401,
        );
      }

      const comment =
        await transaction.projectTaskComment.findUnique({
          where: {
            id: commentId,
          },
          select: {
            id: true,
            authorId: true,
            content: true,
            isDeleted: true,
            task: {
              select: {
                id: true,
                projectId: true,
                project: {
                  select: {
                    tradeCaseId: true,
                  },
                },
              },
            },
          },
        });

      if (!comment) {
        throw new AppError(
          "COMMENT_NOT_FOUND",
          404,
        );
      }

      ensureCommentManagementPermission({
        authenticatedUserId:
          authenticatedUser.id,
        authenticatedUserRole:
          authenticatedUser.role,
        commentAuthorId: comment.authorId,
      });

      if (comment.isDeleted) {
        throw new AppError(
          "DELETED_COMMENT_CANNOT_BE_EDITED",
          400,
        );
      }

      if (comment.content === input.content) {
        throw new AppError(
          "COMMENT_CONTENT_UNCHANGED",
          400,
        );
      }

      const updatedComment =
        await transaction.projectTaskComment.update({
          where: {
            id: comment.id,
          },
          data: {
            content: input.content,
            editedAt: new Date(),
          },
          select: COMMENT_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId:
            comment.task.project.tradeCaseId,
          userId: authenticatedUser.id,
          action:
            "PROJECT_TASK_COMMENT_UPDATED",
          details: JSON.stringify({
            commentId: updatedComment.id,
            taskId: comment.task.id,
            projectId: comment.task.projectId,
            authorId: updatedComment.authorId,
            editorId: authenticatedUser.id,
            editedByAdmin:
              authenticatedUser.role === "admin" &&
              updatedComment.authorId !==
                authenticatedUser.id,
            previousContentLength:
              comment.content.length,
            contentLength:
              updatedComment.content.length,
            editedAt: updatedComment.editedAt,
          }),
        },
      });

      return updatedComment;
    },
    "PROJECT_TASK_COMMENT_MANAGEMENT_CONFLICT",
  );
}

export async function deleteProjectTaskComment({
  commentId,
  authenticatedUserId,
}: {
  commentId: number;
  authenticatedUserId: number;
}): Promise<DeleteProjectTaskCommentResult> {
  return executeCommentTransaction(
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
        throw new AppError(
          "AUTHENTICATED_USER_NOT_FOUND",
          401,
        );
      }

      const comment =
        await transaction.projectTaskComment.findUnique({
          where: {
            id: commentId,
          },
          select: {
            id: true,
            authorId: true,
            parentId: true,
            content: true,
            isDeleted: true,
            task: {
              select: {
                id: true,
                projectId: true,
                project: {
                  select: {
                    tradeCaseId: true,
                  },
                },
              },
            },
          },
        });

      if (!comment) {
        throw new AppError(
          "COMMENT_NOT_FOUND",
          404,
        );
      }

      ensureCommentManagementPermission({
        authenticatedUserId:
          authenticatedUser.id,
        authenticatedUserRole:
          authenticatedUser.role,
        commentAuthorId: comment.authorId,
      });

      if (comment.isDeleted) {
        return {
          comment: null,
          alreadyDeleted: true,
        };
      }

      const deletedAt = new Date();
      const deletedComment =
        await transaction.projectTaskComment.update({
          where: {
            id: comment.id,
          },
          data: {
            isDeleted: true,
            content:
              "This comment was deleted.",
            editedAt: deletedAt,
          },
          select: COMMENT_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId:
            comment.task.project.tradeCaseId,
          userId: authenticatedUser.id,
          action:
            "PROJECT_TASK_COMMENT_DELETED",
          details: JSON.stringify({
            commentId: deletedComment.id,
            taskId: comment.task.id,
            projectId: comment.task.projectId,
            authorId: deletedComment.authorId,
            deletedBy: authenticatedUser.id,
            deletedByAdmin:
              authenticatedUser.role === "admin" &&
              deletedComment.authorId !==
                authenticatedUser.id,
            parentId: deletedComment.parentId,
            previousContentLength:
              comment.content.length,
            deletedAt,
          }),
        },
      });

      return {
        comment: deletedComment,
        alreadyDeleted: false,
      };
    },
    "PROJECT_TASK_COMMENT_MANAGEMENT_CONFLICT",
  );
}
