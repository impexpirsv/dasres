import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { markNotificationAsRead } from "../../../../../lib/notifications/mark-notification-as-read";
import { parseId } from "../../../../../lib/validation";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const notificationId = parseId(
      id,
      "notification id",
    );

    const result =
      await markNotificationAsRead({
        userId: user.id,
        notificationId,
      });

    return Response.json(result);
  });
}
