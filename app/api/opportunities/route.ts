import { apiHandler } from "../../../lib/api";
import { requireAdmin } from "../../../lib/auth";
import {
  createOpportunity,
  parseCreateOpportunityInput,
} from "../../../lib/opportunities/create-opportunity";

export const runtime = "nodejs";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const admin = await requireAdmin();

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
