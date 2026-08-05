import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import {
  createProjectTask,
  parseCreateProjectTaskPayload,
} from "../../../../../lib/project-tasks/create-project-task";
import { parseId } from "../../../../../lib/validation";

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
    const user = await requireUser();

    const { id } = await params;
    const projectId = parseId(
      id,
      "project id",
    );

    const payload =
      await parseCreateProjectTaskPayload(
        request,
      );

    const task =
      await createProjectTask({
        projectId,
        authenticatedUserId:
          user.id,
        payload,
      });

    return Response.json(
      {
        code:
          "PROJECT_TASK_CREATED",
        task,
      },
      {
        status: 201,
      },
    );
  });
}
