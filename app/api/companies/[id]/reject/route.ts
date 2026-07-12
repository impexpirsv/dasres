import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyCompanyVerification } from "../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const companyId = Number(id);

    const company = await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        verificationStatus: "REJECTED",
        verifiedAt: null,
      },
    });

    

    if (company.ownerId) {
      await notifyCompanyVerification({
  userId: company.ownerId,
  approved: false,
  companyId: company.id,
});
    }

    return Response.json({
      message: "Company rejected",
    });
  } catch {
    return Response.json(
      { message: "Failed to reject company" },
      { status: 500 }
    );
  }
}