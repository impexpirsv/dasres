import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

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

    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        verificationStatus: "REJECTED",
        verifiedAt: null,
      },
    });

    return Response.json({
      code: "COMPANY_REJECTED",
    });
  } catch {
    return Response.json(
      {
        code: "COMPANY_REJECTION_FAILED",
      },
      { status: 500 },
    );
  }
}