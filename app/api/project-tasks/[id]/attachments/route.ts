import { apiHandler } from "../../../../../lib/api";
import { requireApiUser } from "../../../../../lib/auth";
import { uploadProjectTaskAttachment } from "../../../../../lib/project-task-attachments";
import { parseId } from "../../../../../lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();

    const { id } = await params;
    const taskId = parseId(
      id,
      "task id",
    );

    const attachment =
      await uploadProjectTaskAttachment({
        request,
        taskId,
        authenticatedUserId:
          user.id,
      });

    return Response.json(
      {
        code:
          "PROJECT_TASK_ATTACHMENT_UPLOADED",
        attachment,
      },
      {
        status: 201,
      },
    );
  });
}
