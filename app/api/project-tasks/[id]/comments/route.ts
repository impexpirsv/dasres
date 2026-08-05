import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import { notifyTaskComment } from "../../../../../lib/notificationEvents";
import {
  createProjectTaskComment,
  parseCreateProjectTaskCommentInput,
} from "../../../../../lib/project-task-comments";
import { parseId } from "../../../../../lib/validation";

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  const contentType = request.headers.get(
    "content-type",
  );

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  try {
    return await request.json();
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
      400,
    );
  }
}

export async function POST(
  request: Request,
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
    const taskId = parseId(id, "task id");
    const body = await readJsonBody(request);
    const input =
      parseCreateProjectTaskCommentInput(
        body,
      );

    const result =
      await createProjectTaskComment({
        taskId,
        authenticatedUserId: user.id,
        input,
      });

    if (
      result.receiverId !== null &&
      result.receiverId !== user.id
    ) {
      try {
        await notifyTaskComment({
          userId: result.receiverId,
          taskTitle: result.taskTitle,
          projectId: result.projectId,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_TASK_COMMENT_NOTIFICATION_ERROR",
          {
            taskId,
            commentId: result.comment.id,
            receiverId: result.receiverId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json(
      {
        code:
          "PROJECT_TASK_COMMENT_CREATED",
        comment: result.comment,
      },
      {
        status: 201,
      },
    );
  });
}
