import { apiHandler } from "../../../../lib/api";
import { getCurrentUser } from "../../../../lib/auth";
import { AppError } from "../../../../lib/errors";
import {
  parseUpdateProjectTaskInput,
  updateProjectTask,
} from "../../../../lib/project-tasks";
import { parseId } from "../../../../lib/validation";

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  const contentType =
    request.headers.get("content-type");

  if (
    !contentType
      ?.toLowerCase()
      .includes("application/json")
  ) {
    throw AppError.unsupportedMediaType(
      "Content-Type must be application/json.",
    );
  }

  try {
    return await request.json();
  } catch (error) {
    throw AppError.badRequest(
      "Request body contains invalid JSON.",
      { cause: error },
    );
  }
}

export async function PATCH(
  request: Request,
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
    const body = await readJsonBody(request);
    const input = parseUpdateProjectTaskInput(body);

    const task = await updateProjectTask({
      taskId,
      authenticatedUserId: user.id,
      input,
    });

    return Response.json({
      code: "PROJECT_TASK_UPDATED",
      task,
    });
  });
}
