import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;

    const proposal = await prisma.caseProposal.update({
  where: {
    id: Number(id),
  },
  data: {
    status: "REJECTED",
  },
});

await prisma.caseActivity.create({
  data: {
    caseId: proposal.caseId,
    userId: user.id,
    action: "PROPOSAL_REJECTED",
    details: `Proposal #${proposal.id} rejected.`,
  },
});

    await prisma.caseActivity.create({
      data: {
        caseId: proposal.caseId,
        action: "PROPOSAL_REJECTED",
        details: `Proposal #${proposal.id} rejected.`,
      },
    });

    return Response.json({
      message: "Proposal rejected",
    });
  } catch {
    return Response.json(
      { message: "Failed to reject proposal" },
      { status: 500 },
    );
  }
}
