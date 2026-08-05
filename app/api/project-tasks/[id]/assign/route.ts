import { apiHandler } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import {
  assignProjectTask,
  parseAssignProjectTaskInput,
} from "../../../../../lib/project-tasks";
import { parseId } from "../../../../../lib/validation";

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
    const admin = await requireAdmin();
    const { id } = await params;
    const taskId = parseId(id, "task id");
    const body = await readJsonBody(request);
    const input = parseAssignProjectTaskInput(body);

    const result = await assignProjectTask({
      taskId,
      authenticatedUserId: admin.id,
      input,
    });

    return Response.json({
      code: result.changed
        ? "TASK_ASSIGNMENT_UPDATED"
        : "TASK_ASSIGNMENT_UNCHANGED",
      task: result.task,
    });
  });
}
