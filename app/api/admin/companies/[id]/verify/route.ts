import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";
import { notifyCompanyVerification } from "../../../../../../lib/notificationEvents";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const companyId = Number(id);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return Response.json(
        {
          code: "INVALID_COMPANY_ID",
        },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!company) {
      return Response.json(
        {
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const updatedCompany = await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    if (updatedCompany.ownerId) {
      await notifyCompanyVerification({
        userId: updatedCompany.ownerId,
        approved: true,
        companyId: updatedCompany.id,
      });
    }

    return Response.json({
      code: "COMPANY_VERIFIED",
    });
  } catch {
    return Response.json(
      {
        code: "COMPANY_VERIFICATION_FAILED",
      },
      { status: 500 },
    );
  }
}