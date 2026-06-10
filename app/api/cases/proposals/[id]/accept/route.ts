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
        status: "ACCEPTED",
      },
    });

    return Response.json({
      message: "Proposal accepted",
    });
  } catch {
    return Response.json(
      { message: "Failed to accept proposal" },
      { status: 500 }
    );
  }
}