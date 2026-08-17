import { apiHandler } from "../../../../../../lib/api";
import { requireApiUser } from "../../../../../../lib/auth";
import { deleteCaseDocument, downloadCaseDocument } from "../../../../../../lib/cases";
import { parseId } from "../../../../../../lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    return downloadCaseDocument({
      documentId: parseId(id, "case document id"),
      authenticatedUserId: user.id,
    });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser(); const { id } = await params;
    await deleteCaseDocument({ documentId: parseId(id, "case document id"), authenticatedUserId: user.id });
    return Response.json({ code: "CASE_DOCUMENT_DELETED" });
  });
}
