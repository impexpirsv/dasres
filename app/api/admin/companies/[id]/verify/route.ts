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
  await prisma.notification.create({
    data: {
      userId: company.ownerId,
      title: "Company Verified",
      message:
        "Your company has been successfully verified.",
      type: "COMPANY_VERIFIED",
      link: `/companies/${company.id}`,
    },
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