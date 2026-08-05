import { apiHandler } from "../../../../lib/api";
import { requireUser } from "../../../../lib/auth";
import { markAllNotificationsAsRead } from "../../../../lib/notifications/mark-all-notifications-as-read";

export async function POST(): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const result =
      await markAllNotificationsAsRead({
        userId: user.id,
      });

    return Response.json(result);
  });
}
