import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { toggleSavedCase } from "../../../../../lib/cases/toggle-saved-case";
import { parseId } from "../../../../../lib/validation";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(
      id,
      "case id",
    );

    const result =
      await toggleSavedCase({
        caseId,
        authenticatedUserId:
          user.id,
      });

    if (!result.saved) {
      return Response.json({
        code:
          "CASE_REMOVED_FROM_SAVED",
        saved: false,
        savedCase: null,
      });
    }

    return Response.json(
      {
        code: "CASE_SAVED",
        saved: true,
        savedCase:
          result.savedCase,
      },
      {
        status: 201,
      },
    );
  });
}
