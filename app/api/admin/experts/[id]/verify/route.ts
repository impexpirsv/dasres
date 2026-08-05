import { apiHandler } from "../../../../../../lib/api";
import { requireAdmin } from "../../../../../../lib/auth";
import { verifyExpert } from "../../../../../../lib/experts";
import { parseId } from "../../../../../../lib/validation";

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
    const admin =
      await requireAdmin();

    const { id } = await params;
    const expertId = parseId(
      id,
      "expert id",
    );

    const result =
      await verifyExpert({
        expertId,
        authenticatedAdminId:
          admin.id,
      });

    if (result.alreadyVerified) {
      return Response.json({
        code:
          "EXPERT_ALREADY_VERIFIED",
        expert: result.expert,
      });
    }

    return Response.json({
      code: "EXPERT_VERIFIED",
      expert: result.expert,
    });
  });
}
