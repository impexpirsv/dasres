import { apiHandler } from "../../../../../../lib/api";
import { requireUser } from "../../../../../../lib/auth";
import { acceptProposal } from "../../../../../../lib/case-proposals";
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
    const user = await requireUser();

    const { id } = await params;
    const proposalId = parseId(
      id,
      "proposal id",
    );

    const result = await acceptProposal({
      proposalId,
      authenticatedUserId: user.id,
    });

    return Response.json({
      code: "PROPOSAL_ACCEPTED",
      caseId: result.caseId,
      proposalId: result.proposalId,
    });
  });
}
