import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;

    await prisma.caseProposal.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "REJECTED",
      },
    });

    return Response.json({
      message: "Proposal rejected",
    });
  } catch {
    return Response.json(
      { message: "Failed to reject proposal" },
      { status: 500 }
    );
  }
}