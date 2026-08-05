import { apiHandler } from "../../../../../../lib/api";
import { requireAdmin } from "../../../../../../lib/auth";
import {
  parseUpdateUserPlanInput,
  updateUserPlan,
} from "../../../../../../lib/users/update-user-plan";
import { parseId } from "../../../../../../lib/validation";

export async function PATCH(
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
    const admin =
      await requireAdmin();

    const { id } = await params;
    const userId = parseId(
      id,
      "user id",
    );

    const input =
      await parseUpdateUserPlanInput(
        request,
      );

    const result =
      await updateUserPlan({
        userId,
        authenticatedAdminId:
          admin.id,
        input,
      });

    if (result.alreadyUpdated) {
      return Response.json({
        code:
          "PLAN_ALREADY_UPDATED",
        user: result.user,
      });
    }

    return Response.json({
      code: "PLAN_UPDATED",
      user: result.user,
    });
  });
}
