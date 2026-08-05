import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyProjectMessage } from "../notificationEvents";
import { runInTransaction } from "../transactions";
import { parseId } from "../validation";

const MAX_MESSAGE_LENGTH = 5_000;
const DEFAULT_CONVERSATION_TITLE =
  "Project Conversation";

const CREATED_MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  message: true,
  createdAt: true,
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectMessageSelect;

export type CreatedProjectMessage =
  Prisma.ProjectMessageGetPayload<{
    select: typeof CREATED_MESSAGE_SELECT;
  }>;

export type CreateProjectMessagePayload = {
  projectId: number;
  conversationId: number | null;
  message: string;
};

export type CreateProjectMessageResult = {
  projectId: number;
  conversationId: number;
  message: CreatedProjectMessage;
  notificationRecipientIds: number[];
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
    request.headers.get("content-type");

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes("application/json")
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

function parseRequiredId(
  value: unknown,
  errorCode: string,
  fieldName: string,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  try {
    return parseId(
      String(value),
      fieldName,
    );
  } catch {
    throw new AppError(
      errorCode,
      400,
    );
  }
}

function parseOptionalId(
  value: unknown,
  errorCode: string,
  fieldName: string,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  try {
    return parseId(
      String(value),
      fieldName,
    );
  } catch {
    throw new AppError(
      errorCode,
      400,
    );
  }
}

function parseMessage(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new AppError(
      "PROJECT_MESSAGE_REQUIRED",
      400,
    );
  }

  const message = value.trim();

  if (!message) {
    throw new AppError(
      "PROJECT_MESSAGE_REQUIRED",
      400,
    );
  }

  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {
    throw new AppError(
      "PROJECT_MESSAGE_TOO_LONG",
      400,
    );
  }

  return message;
}

function parsePayload(
  body: unknown,
): CreateProjectMessagePayload {
  if (!isPlainObject(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return {
    projectId: parseRequiredId(
      body.projectId,
      "INVALID_PROJECT_ID",
      "project id",
    ),
    conversationId: parseOptionalId(
      body.conversationId,
      "INVALID_CONVERSATION_ID",
      "conversation id",
    ),
    message: parseMessage(
      body.message,
    ),
  };
}

export async function parseCreateProjectMessagePayload(
  request: Request,
): Promise<CreateProjectMessagePayload> {
  const body = await readJsonBody(
    request,
  );

  return parsePayload(body);
}

function ensureProjectAccess({
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

  const isCreator =
    projectCreatedBy === userId;

  const isAssignee =
    projectAssignedTo === userId;

  if (
    !isAdmin &&
    !isCreator &&
    !isAssignee
  ) {
    throw new AppError(
      "PROJECT_ACCESS_DENIED",
      403,
    );
  }
}

function getNotificationRecipientIds({
  senderId,
  projectCreatedBy,
  projectAssignedTo,
}: {
  senderId: number;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): number[] {
  const recipientIds =
    new Set<number>();

  if (
    projectCreatedBy !== null &&
    projectCreatedBy !== senderId
  ) {
    recipientIds.add(
      projectCreatedBy,
    );
  }

  if (
    projectAssignedTo !== null &&
    projectAssignedTo !== senderId
  ) {
    recipientIds.add(
      projectAssignedTo,
    );
  }

  return Array.from(recipientIds);
}

function mapProjectMessageError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2034") {
      throw new AppError(
        "PROJECT_MESSAGE_CREATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function createProjectMessage({
  authenticatedUserId,
  payload,
}: {
  authenticatedUserId: number;
  payload: CreateProjectMessagePayload;
}): Promise<CreateProjectMessageResult> {
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
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        const project =
          await transaction.project.findUnique({
            where: {
              id: payload.projectId,
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

        ensureProjectAccess({
          userId:
            authenticatedUser.id,
          userRole:
            authenticatedUser.role,
          projectCreatedBy:
            project.createdBy,
          projectAssignedTo:
            project.assignedTo,
        });

        let conversationId =
          payload.conversationId;

        let conversationCreated =
          false;

        if (conversationId !== null) {
          const existingConversation =
            await transaction.projectConversation.findUnique({
              where: {
                id: conversationId,
              },
              select: {
                id: true,
                projectId: true,
              },
            });

          if (
            !existingConversation ||
            existingConversation.projectId !==
              project.id
          ) {
            throw new AppError(
              "INVALID_PROJECT_CONVERSATION",
              400,
            );
          }
        } else {
          const conversation =
            await transaction.projectConversation.create({
              data: {
                projectId:
                  project.id,
                title:
                  DEFAULT_CONVERSATION_TITLE,
              },
              select: {
                id: true,
              },
            });

          conversationId =
            conversation.id;

          conversationCreated =
            true;
        }

        const resolvedConversationId =
          conversationId;

        const createdMessage =
          await transaction.projectMessage.create({
            data: {
              conversationId:
                resolvedConversationId,
              senderId:
                authenticatedUser.id,
              message:
                payload.message,
            },
            select:
              CREATED_MESSAGE_SELECT,
          });

        await transaction.caseActivity.create({
          data: {
            caseId:
              project.tradeCaseId,
            userId:
              authenticatedUser.id,
            action:
              "PROJECT_MESSAGE_SENT",
            details:
              JSON.stringify({
                projectId:
                  project.id,
                conversationId:
                  resolvedConversationId,
                conversationCreated,
                messageId:
                  createdMessage.id,
                senderId:
                  createdMessage.senderId,
                messageLength:
                  createdMessage.message.length,
                createdAt:
                  createdMessage.createdAt,
              }),
          },
        });

        return {
          projectId:
            project.id,
          conversationId:
            resolvedConversationId,
          message:
            createdMessage,
          notificationRecipientIds:
            getNotificationRecipientIds({
              senderId:
                authenticatedUser.id,
              projectCreatedBy:
                project.createdBy,
              projectAssignedTo:
                project.assignedTo,
            }),
        };
      },
    );
  } catch (error) {
    mapProjectMessageError(error);
  }
}

export async function sendProjectMessageNotifications({
  projectId,
  messageId,
  recipientIds,
}: {
  projectId: number;
  messageId: number;
  recipientIds: number[];
}): Promise<void> {
  const notificationResults =
    await Promise.allSettled(
      recipientIds.map(
        async (recipientId) => {
          await notifyProjectMessage({
            userId: recipientId,
            projectId,
          });
        },
      ),
    );

  notificationResults.forEach(
    (result, index) => {
      if (
        result.status ===
        "rejected"
      ) {
        logger.error(
          "PROJECT_MESSAGE_NOTIFICATION_ERROR",
          {
            projectId,
            messageId,
            receiverId:
              recipientIds[index],
            error:
              result.reason,
          },
        );
      }
    },
  );
}
