import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

export async function POST() {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return Response.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}