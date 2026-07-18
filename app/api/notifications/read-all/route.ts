import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

export async function POST() {
  try {
    const user = await requireUser();

    const result =
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
      code: "NOTIFICATIONS_MARKED_AS_READ",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error(
      "NOTIFICATIONS_READ_ALL_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "NOTIFICATIONS_READ_ALL_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}