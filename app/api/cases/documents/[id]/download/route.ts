import { apiHandler } from "../../../../../../lib/api";
import { requireUser } from "../../../../../../lib/auth";
import { downloadCaseDocument } from "../../../../../../lib/cases";
import { parseId } from "../../../../../../lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return downloadCaseDocument({
      documentId: parseId(id, "case document id"),
      authenticatedUserId: user.id,
    });
  });
}
