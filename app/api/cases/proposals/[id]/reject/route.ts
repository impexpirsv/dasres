import { apiHandler } from "../../../../../../lib/api";
import { requireUser } from "../../../../../../lib/auth";
import { rejectProposal } from "../../../../../../lib/case-proposals";
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

    const result = await rejectProposal({
      proposalId,
      authenticatedUserId: user.id,
    });

    if (result.alreadyRejected) {
      return Response.json({
        code: "PROPOSAL_ALREADY_REJECTED",
        proposalId: result.proposalId,
        caseId: result.caseId,
      });
    }

    return Response.json({
      code: "PROPOSAL_REJECTED",
      proposalId: result.proposalId,
      caseId: result.caseId,
    });
  });
}
