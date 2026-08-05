import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { toggleProjectTaskChecklistItem } from "../../../../../lib/project-tasks";
import { parseId } from "../../../../../lib/validation";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const checklistItemId = parseId(
      id,
      "checklist item id",
    );

    const result =
      await toggleProjectTaskChecklistItem({
        checklistItemId,
        authenticatedUserId: user.id,
      });

    return Response.json({
      code: "PROJECT_TASK_CHECKLIST_TOGGLED",
      checklistItem: result.checklistItem,
      taskProgress: result.taskProgress,
      projectProgress: result.projectProgress,
    });
  });
}
