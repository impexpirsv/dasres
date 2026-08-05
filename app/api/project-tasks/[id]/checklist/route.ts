import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import {
  createProjectTaskChecklistItem,
  parseCreateProjectTaskChecklistInput,
} from "../../../../../lib/project-tasks";
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
    const taskId = parseId(
      id,
      "task id",
    );

    const input =
      await parseCreateProjectTaskChecklistInput(
        request,
      );

    const checklistItem =
      await createProjectTaskChecklistItem({
        taskId,
        authenticatedUserId:
          user.id,
        input,
      });

    return Response.json(
      {
        code:
          "PROJECT_TASK_CHECKLIST_CREATED",
        checklistItem,
      },
      {
        status: 201,
      },
    );
  });
}
