import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";
import { notifyCompanyVerification } from "../../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const companyId = Number(id);

    const company =
  await prisma.company.update({
    where: {
      id: companyId,
    },
    data: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

if (company.ownerId) {
  await notifyCompanyVerification({
  userId: company.ownerId,
  approved: true,
  companyId: company.id,
});
}

    return Response.json({
      message: "Company verified",
    });
  } catch (error) {
    return Response.json(
      { message: "Failed to verify company" },
      { status: 500 }
    );
  }
}