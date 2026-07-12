import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { parseId } from "../../../../../lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const notificationId = parseId(id, "notification id");

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return Response.json(
        { message: "Notification not found" },
        { status: 404 },
      );
    }

    if (notification.userId !== user.id) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 403 },
      );
    }

    if (notification.isRead) {
      return Response.json({
        message: "Already read",
      });
    }

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });

    return Response.json({
      message: "Notification marked as read",
    });
  } catch {
    return Response.json(
      { message: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}