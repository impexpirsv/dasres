import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

function getCompanyId(id: string) {
  const companyId = Number(id);

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0
  ) {
    return null;
  }

  return companyId;
}

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const companyId = getCompanyId(id);

    if (companyId === null) {
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

    const existingSave =
      await prisma.savedCompany.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId,
          },
        },
        select: {
          userId: true,
        },
      });

    if (existingSave) {
      await prisma.savedCompany.delete({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId,
          },
        },
      });

      return Response.json({
        code: "COMPANY_UNSAVED",
        saved: false,
      });
    }

    await prisma.savedCompany.create({
      data: {
        userId: user.id,
        companyId,
      },
    });

    return Response.json({
      code: "COMPANY_SAVED",
      saved: true,
    });
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return Response.json({
          code: "COMPANY_SAVED",
          saved: true,
        });
      }
    }

    console.error("COMPANY_SAVE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "COMPANY_SAVE_FAILED",
      },
      { status: 500 },
    );
  }
}