import { apiHandler } from "../../../lib/api";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

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

type TicketCategory =
  (typeof ALLOWED_CATEGORIES)[number];

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    const user = await requireUser();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "INVALID_JSON_BODY",
        400,
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
      );
    }

    const payload = body as Record<
      string,
      unknown
    >;

    const subject = String(
      payload.subject ?? "",
    ).trim();

    const message = String(
      payload.message ?? "",
    ).trim();

    const category = String(
      payload.category ?? "GENERAL",
    )
      .trim()
      .toUpperCase() as TicketCategory;

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

    if (
      !ALLOWED_CATEGORIES.includes(
        category,
      )
    ) {
      throw new AppError(
        "INVALID_TICKET_CATEGORY",
        400,
      );
    }

    const ticket =
      await prisma.$transaction(
        async (transaction) => {
          const createdTicket =
            await transaction.ticket.create({
              data: {
                userId: user.id,
                subject,
                category,
                messages: {
                  create: {
                    senderId: user.id,
                    message,
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
                  not: user.id,
                },
              },
              select: {
                id: true,
              },
            });

          if (admins.length > 0) {
            await transaction.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                title: "New ticket created",
                message: `${
                  user.name || user.email
                } created a new ticket: ${subject}`,
                type: "TICKET_CREATED",
                link: `/dashboard/tickets/${createdTicket.id}`,
              })),
            });
          }

          return createdTicket;
        },
      );

    return Response.json(
      {
        code: "TICKET_CREATED",
        ticket,
      },
      {
        status: 201,
      },
    );
  });
}