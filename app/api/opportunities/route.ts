import { apiHandler } from "../../../lib/api";
import { requireApiAdmin } from "../../../lib/auth";
import {
  createOpportunity,
  parseCreateOpportunityInput,
} from "../../../lib/opportunities/create-opportunity";

export const runtime = "nodejs";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const admin = await requireApiAdmin();

    const input =
      await parseCreateOpportunityInput(
        request,
      );

    const opportunity =
      await createOpportunity({
        authenticatedAdminId:
          admin.id,
        input,
      });

    return Response.json(
      {
        code:
          "OPPORTUNITY_CREATED",
        opportunity,
      },
      {
        status: 201,
      },
    );
  });
}
