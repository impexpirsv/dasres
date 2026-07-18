import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const expertId = Number(id);

    if (!Number.isInteger(expertId) || expertId <= 0) {
      return Response.json(
        {
          code: "INVALID_EXPERT_ID",
        },
        { status: 400 },
      );
    }

    const expert = await prisma.expert.findUnique({
      where: {
        id: expertId,
      },
      select: {
        id: true,
      },
    });

    if (!expert) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    await prisma.expert.update({
      where: {
        id: expertId,
      },
      data: {
        verificationStatus: "REJECTED",
      },
    });

    return Response.json({
      code: "EXPERT_REJECTED",
    });
  } catch {
    return Response.json(
      {
        code: "EXPERT_REJECTION_FAILED",
      },
      { status: 500 },
    );
  }
}