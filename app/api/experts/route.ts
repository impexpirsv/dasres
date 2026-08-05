import { apiHandler } from "../../../lib/api";
import { requireUser } from "../../../lib/auth";
import {
  createExpert,
  parseCreateExpertInput,
} from "../../../lib/experts/create-expert";

export const runtime = "nodejs";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const input =
      await parseCreateExpertInput(
        request,
      );

    const expert =
      await createExpert({
        authenticatedUserId:
          user.id,
        input,
      });

    return Response.json(
      {
        code: "EXPERT_CREATED",
        expert,
      },
      {
        status: 201,
      },
    );
  });
}
