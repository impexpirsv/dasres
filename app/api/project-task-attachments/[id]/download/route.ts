import { apiHandler } from "../../../../../lib/api";
import { requireApiUser } from "../../../../../lib/auth";
import { deleteProjectTaskAttachment, downloadProjectTaskAttachment } from "../../../../../lib/project-task-attachments";
import { parseId } from "../../../../../lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    return downloadProjectTaskAttachment({
      attachmentId: parseId(id, "project task attachment id"),
      authenticatedUserId: user.id,
    });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser(); const { id } = await params;
    await deleteProjectTaskAttachment({ attachmentId: parseId(id, "project task attachment id"), authenticatedUserId: user.id });
    return Response.json({ code: "PROJECT_TASK_ATTACHMENT_DELETED" });
  });
}
