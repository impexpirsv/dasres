import { apiHandler } from "../../../../lib/api";
import { requireUser } from "../../../../lib/auth";
import { AppError } from "../../../../lib/errors";
import {
  deleteProjectTaskComment,
  parseUpdateProjectTaskCommentInput,
  updateProjectTaskComment,
} from "../../../../lib/project-task-comments";
import { parseId } from "../../../../lib/validation";

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

export async function PATCH(
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
    const commentId = parseId(
      id,
      "comment id",
    );
    const body = await readJsonBody(request);
    const input =
      parseUpdateProjectTaskCommentInput(
        body,
      );

    const comment =
      await updateProjectTaskComment({
        commentId,
        authenticatedUserId: user.id,
        input,
      });

    return Response.json({
      code:
        "PROJECT_TASK_COMMENT_UPDATED",
      comment,
    });
  });
}

export async function DELETE(
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
    const commentId = parseId(
      id,
      "comment id",
    );

    const result =
      await deleteProjectTaskComment({
        commentId,
        authenticatedUserId: user.id,
      });

    if (result.alreadyDeleted) {
      return Response.json({
        code:
          "PROJECT_TASK_COMMENT_ALREADY_DELETED",
      });
    }

    return Response.json({
      code:
        "PROJECT_TASK_COMMENT_DELETED",
      comment: result.comment,
    });
  });
}
