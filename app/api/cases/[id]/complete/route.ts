import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { completeCase } from "../../../../../lib/cases";
import { parseId } from "../../../../../lib/validation";

export async function PATCH(
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

    const result = await completeCase({
      caseId,
      authenticatedUserId: user.id,
    });

    if (result.alreadyCompleted) {
      return Response.json({
        code: "CASE_ALREADY_COMPLETED",
        tradeCase: result.tradeCase,
      });
    }

    return Response.json({
      code: "CASE_COMPLETED",
      tradeCase: result.tradeCase,
    });
  });
}
