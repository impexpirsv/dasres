import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { runInTransaction } from "../transactions";

const MAX_SUBJECT_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 10_000;

const ALLOWED_CATEGORIES = [
  "GENERAL",
  "TECHNICAL",
  "BILLING",
  "VERIFICATION",
  "ACCOUNT",
  "OTHER",
] as const;

export type TicketCategory =
  (typeof ALLOWED_CATEGORIES)[number];

export type CreateTicketPayload = {
  subject: string;
  message: string;
  category: TicketCategory;
};

export type CreateTicketResult = {
  ticket: {
    id: number;
    userId: number;
    subject: string;
    category: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  adminIds: number[];
  actorDisplayName: string;
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

function validateSubject(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new AppError(
      "TICKET_SUBJECT_REQUIRED",
      400,
    );
  }

  const subject = value.trim();

  if (!subject) {
    throw new AppError(
      "TICKET_SUBJECT_REQUIRED",
      400,
    );
  }

  if (
    subject.length >
    MAX_SUBJECT_LENGTH
  ) {
    throw new AppError(
      "TICKET_SUBJECT_TOO_LONG",
      400,
    );
  }

  return subject;
}

function validateMessage(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new AppError(
      "TICKET_MESSAGE_REQUIRED",
      400,
    );
  }

  const message = value.trim();

  if (!message) {
    throw new AppError(
      "TICKET_MESSAGE_REQUIRED",
      400,
    );
  }

  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {
    throw new AppError(
      "TICKET_MESSAGE_TOO_LONG",
      400,
    );
  }

  return message;
}

function validateCategory(
  value: unknown,
): TicketCategory {
  if (
    value === undefined ||
    value === null
  ) {
    return "GENERAL";
  }

  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_TICKET_CATEGORY",
      400,
    );
  }

  const category =
    value.trim().toUpperCase();

  if (
    !ALLOWED_CATEGORIES.includes(
      category as TicketCategory,
    )
  ) {
    throw new AppError(
      "INVALID_TICKET_CATEGORY",
      400,
    );
  }

  return category as TicketCategory;
}

function parseTicketPayload(
  body: unknown,
): CreateTicketPayload {
  if (!isPlainObject(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return {
    subject: validateSubject(
      body.subject,
    ),
    message: validateMessage(
      body.message,
    ),
    category: validateCategory(
      body.category,
    ),
  };
}

export async function parseCreateTicketPayload(
  request: Request,
): Promise<CreateTicketPayload> {
  const body = await readJsonBody(
    request,
  );

  return parseTicketPayload(body);
}

function mapCreateTicketError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "TICKET_CREATE_CONFLICT",
      409,
    );
  }

  throw error;
}

export async function createTicket({
  authenticatedUserId,
  payload,
}: {
  authenticatedUserId: number;
  payload: CreateTicketPayload;
}): Promise<CreateTicketResult> {
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
              name: true,
              email: true,
            },
          });

        if (!authenticatedUser) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        const createdTicket =
          await transaction.ticket.create({
            data: {
              userId:
                authenticatedUser.id,
              subject:
                payload.subject,
              category:
                payload.category,
              messages: {
                create: {
                  senderId:
                    authenticatedUser.id,
                  message:
                    payload.message,
                },
              },
            },
            select: {
              id: true,
              userId: true,
              subject: true,
              category: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });

        const admins =
          await transaction.user.findMany({
            where: {
              role: "admin",
              id: {
                not:
                  authenticatedUser.id,
              },
            },
            select: {
              id: true,
            },
          });

        return {
          ticket: createdTicket,
          adminIds: admins.map(
            (admin) => admin.id,
          ),
          actorDisplayName:
            authenticatedUser.name?.trim() ||
            authenticatedUser.email,
        };
      },
    );
  } catch (error) {
    mapCreateTicketError(error);
  }
}

export async function createTicketNotifications({
  adminIds,
  ticketId,
  subject,
  actorDisplayName,
}: {
  adminIds: number[];
  ticketId: number;
  subject: string;
  actorDisplayName: string;
}): Promise<void> {
  if (adminIds.length === 0) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: adminIds.map(
        (adminId) => ({
          userId: adminId,
          title:
            "New ticket created",
          message:
            `${actorDisplayName} created a new ticket: ${subject}`,
          type:
            "TICKET_CREATED",
          link:
            `/dashboard/tickets/${ticketId}`,
        }),
      ),
    });
  } catch (error) {
   logger.error(
  "TICKET_CREATED_NOTIFICATION_FAILED",
  {
    ticketId,
    receiverIds: adminIds,
    error:
      error instanceof Error
        ? error.message
        : String(error),
  },
);
  }
}
