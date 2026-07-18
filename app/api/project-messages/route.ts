import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { notifyProjectMessage } from "../../../lib/notificationEvents";
import { parseId } from "../../../lib/validation";

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          code: "INVALID_JSON_BODY",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return Response.json(
        {
          code: "INVALID_REQUEST_BODY",
        },
        {
          status: 400,
        },
      );
    }

    const payload = body as Record<
      string,
      unknown
    >;

    let projectId: number;

    try {
      projectId = parseId(
        String(payload.projectId ?? ""),
        "project id",
      );
    } catch {
      return Response.json(
        {
          code: "INVALID_PROJECT_ID",
        },
        {
          status: 400,
        },
      );
    }

    let conversationId: number | null = null;

    if (
      payload.conversationId !== undefined &&
      payload.conversationId !== null &&
      payload.conversationId !== ""
    ) {
      try {
        conversationId = parseId(
          String(payload.conversationId),
          "conversation id",
        );
      } catch {
        return Response.json(
          {
            code: "INVALID_CONVERSATION_ID",
          },
          {
            status: 400,
          },
        );
      }
    }

    const message = String(
      payload.message ?? "",
    ).trim();

    if (!message) {
      return Response.json(
        {
          code: "PROJECT_MESSAGE_REQUIRED",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        {
          code: "PROJECT_MESSAGE_TOO_LONG",
          maxLength: MAX_MESSAGE_LENGTH,
        },
        {
          status: 400,
        },
      );
    }

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
          createdBy: true,
          assignedTo: true,
        },
      });

    if (!project) {
      return Response.json(
        {
          code: "PROJECT_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    const canAccess =
      user.role === "admin" ||
      project.createdBy === user.id ||
      project.assignedTo === user.id;

    if (!canAccess) {
      return Response.json(
        {
          code: "PROJECT_ACCESS_DENIED",
        },
        {
          status: 403,
        },
      );
    }

    if (conversationId !== null) {
      const existingConversation =
        await prisma.projectConversation.findUnique({
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
        return Response.json(
          {
            code: "INVALID_PROJECT_CONVERSATION",
          },
          {
            status: 400,
          },
        );
      }
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const conversation =
          conversationId !== null
            ? {
                id: conversationId,
              }
            : await transaction.projectConversation.create(
                {
                  data: {
                    projectId: project.id,
                    title:
                      "Project Conversation",
                  },
                  select: {
                    id: true,
                  },
                },
              );

        const createdMessage =
          await transaction.projectMessage.create({
            data: {
              conversationId:
                conversation.id,
              senderId: user.id,
              message,
            },
            select: {
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
            },
          });

        return {
          conversationId: conversation.id,
          message: createdMessage,
        };
      },
    );

    const receiverId =
      project.createdBy === user.id
        ? project.assignedTo
        : project.createdBy;

    if (
      receiverId &&
      receiverId !== user.id
    ) {
      try {
        await notifyProjectMessage({
          userId: receiverId,
          projectId: project.id,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_MESSAGE_NOTIFICATION_ERROR",
          {
            projectId: project.id,
            receiverId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json(
      {
        code: "PROJECT_MESSAGE_SENT",
        conversationId:
          result.conversationId,
        message: result.message,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error(
      "PROJECT_MESSAGE_CREATE_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "PROJECT_MESSAGE_CREATE_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}