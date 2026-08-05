import { apiHandler } from "../../../../../../lib/api";
import { requireUser } from "../../../../../../lib/auth";
import {
  completeCaseStep,
  parseCaseStepId,
} from "../../../../../../lib/cases/complete-case-step";

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
    const stepId = parseCaseStepId(id);

    const result =
      await completeCaseStep({
        stepId,
        authenticatedUserId:
          user.id,
      });

    if (result.alreadyCompleted) {
      return Response.json({
        code:
          "CASE_STEP_ALREADY_COMPLETED",
        step: result.step,
      });
    }

    return Response.json({
      code:
        "CASE_STEP_COMPLETED",
      step: result.step,
    });
  });
}
