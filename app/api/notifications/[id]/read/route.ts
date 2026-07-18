import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { parseId } from "../../../../../lib/validation";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const notificationId = parseId(
      id,
      "notification id",
    );

    const notification =
      await prisma.notification.findUnique({
        where: {
          id: notificationId,
        },
        select: {
          id: true,
          userId: true,
          isRead: true,
        },
      });

    if (!notification) {
      return Response.json(
        {
          code: "NOTIFICATION_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      notification.userId !== user.id
    ) {
      return Response.json(
        {
          code: "NOTIFICATION_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    if (notification.isRead) {
      return Response.json({
        code: "NOTIFICATION_ALREADY_READ",
      });
    }

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
      select: {
        id: true,
      },
    });

    return Response.json({
      code: "NOTIFICATION_MARKED_AS_READ",
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        {
          code: "NOTIFICATION_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error(
      "NOTIFICATION_MARK_READ_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "NOTIFICATION_MARK_READ_FAILED",
      },
      { status: 500 },
    );
  }
}