import { apiHandler } from "../../../../../lib/api";
import { getCurrentUser } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import { logger } from "../../../../../lib/logger";
import { notifyTaskCompleted } from "../../../../../lib/notificationEvents";
import { completeProjectTask } from "../../../../../lib/project-tasks";
import { parseId } from "../../../../../lib/validation";

const routeLogger = logger.child({
  route: "PATCH /api/project-tasks/[id]/complete",
});

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw AppError.unauthenticated();
    }

    const { id } = await params;
    const taskId = parseId(id, "task id");

    const result = await completeProjectTask({
      taskId,
      authenticatedUserId: user.id,
    });

    if (
      result.changed &&
      result.notificationReceiverId &&
      result.notificationReceiverId !== user.id
    ) {
      try {
        await notifyTaskCompleted({
          userId:
            result.notificationReceiverId,
          taskTitle: result.task.title,
          projectId: result.task.projectId,
        });
      } catch (error) {
        routeLogger.error(
          "Failed to create project task completion notification.",
          {
            error:
              error instanceof Error
                ? error
                : String(error),
            taskId: result.task.id,
            projectId:
              result.task.projectId,
            receiverId:
              result.notificationReceiverId,
            eventId: result.event?.id,
          },
        );
      }
    }

    return Response.json({
      code: result.changed
        ? "PROJECT_TASK_COMPLETED"
        : "PROJECT_TASK_ALREADY_COMPLETED",
      task: result.task,
      projectProgress:
        result.projectProgress,
    });
  });
}
