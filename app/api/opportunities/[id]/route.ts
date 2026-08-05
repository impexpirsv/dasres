import { apiHandler } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/auth";
import {
  deleteOpportunity,
} from "../../../../lib/opportunities/delete-opportunity";
import {
  getOpportunity,
} from "../../../../lib/opportunities/get-opportunity";
import {
  parseUpdateOpportunityInput,
  updateOpportunity,
} from "../../../../lib/opportunities/update-opportunity";
import { parseId } from "../../../../lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const { id } = await params;
    const opportunityId = parseId(
      id,
      "opportunity id",
    );

    const opportunity =
      await getOpportunity({
        opportunityId,
      });

    return Response.json({
      code:
        "OPPORTUNITY_LOADED",
      opportunity,
    });
  });
}

export async function PUT(
  request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const admin = await requireAdmin();

    const { id } = await params;
    const opportunityId = parseId(
      id,
      "opportunity id",
    );

    await getOpportunity({ opportunityId });

    const input =
      await parseUpdateOpportunityInput(
        request,
      );

    const opportunity =
      await updateOpportunity({
        opportunityId,
        authenticatedAdminId:
          admin.id,
        input,
      });

    return Response.json({
      code:
        "OPPORTUNITY_UPDATED",
      opportunity,
    });
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const admin = await requireAdmin();

    const { id } = await params;
    const opportunityId = parseId(
      id,
      "opportunity id",
    );

    await deleteOpportunity({
      opportunityId,
      authenticatedAdminId:
        admin.id,
    });

    return Response.json({
      code:
        "OPPORTUNITY_DELETED",
    });
  });
}
