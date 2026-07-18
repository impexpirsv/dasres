import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyCompanyVerification } from "../../../../../lib/notificationEvents";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const companyId = Number(id);

    if (
      !Number.isInteger(companyId) ||
      companyId <= 0
    ) {
      return Response.json(
        {
          error: "INVALID_COMPANY_ID",
        },
        { status: 400 },
      );
    }

    const company = await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        verificationStatus: "REJECTED",
        verifiedAt: null,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (company.ownerId !== null) {
      await notifyCompanyVerification({
        userId: company.ownerId,
        approved: false,
        companyId: company.id,
      });
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        {
          error: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error(
      "Failed to reject company verification",
      {
        error,
      },
    );

    return Response.json(
      {
        error: "COMPANY_REJECTION_FAILED",
      },
      { status: 500 },
    );
  }
}