import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const companyId = Number(id);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        verificationStatus: "REJECTED",
        verifiedAt: null,
      },
    });

    return Response.json({
      message: "Company rejected",
    });
  } catch (error) {
    return Response.json(
      { message: "Failed to reject company" },
      { status: 500 }
    );
  }
}