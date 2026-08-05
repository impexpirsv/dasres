import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { downloadProjectTaskAttachment } from "../../../../../lib/project-task-attachments";
import { parseId } from "../../../../../lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return downloadProjectTaskAttachment({
      attachmentId: parseId(id, "project task attachment id"),
      authenticatedUserId: user.id,
    });
  });
}
