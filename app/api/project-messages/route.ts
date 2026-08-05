import { apiHandler } from "../../../lib/api";
import { requireUser } from "../../../lib/auth";
import {
  createProjectMessage,
  parseCreateProjectMessagePayload,
  sendProjectMessageNotifications,
} from "../../../lib/project-messages";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const payload =
      await parseCreateProjectMessagePayload(
        request,
      );

    const result =
      await createProjectMessage({
        authenticatedUserId: user.id,
        payload,
      });

    await sendProjectMessageNotifications({
      projectId: result.projectId,
      messageId: result.message.id,
      recipientIds:
        result.notificationRecipientIds,
    });

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
  });
}
