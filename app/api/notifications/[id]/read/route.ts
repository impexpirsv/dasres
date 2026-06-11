import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;

    const notification =
      await prisma.notification.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!notification) {
      return Response.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
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
      { message: "Failed" },
      { status: 500 }
    );
  }
}