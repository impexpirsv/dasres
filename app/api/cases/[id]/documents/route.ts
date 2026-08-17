import { apiHandler } from "../../../../../lib/api";
import { requireApiUser } from "../../../../../lib/auth";
import { uploadCaseDocument } from "../../../../../lib/cases";
import { parseId } from "../../../../../lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();

    const { id } = await params;
    const caseId = parseId(
      id,
      "case id",
    );

    const document =
      await uploadCaseDocument({
        request,
        caseId,
        authenticatedUserId:
          user.id,
      });

    return Response.json(
      {
        code:
          "CASE_DOCUMENT_UPLOADED",
        document,
      },
      {
        status: 201,
      },
    );
  });
}
