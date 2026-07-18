import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!Number.isInteger(caseId) || caseId <= 0) {
      return Response.json(
        {
          code: "INVALID_CASE_ID",
        },
        { status: 400 },
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      select: {
        id: true,
      },
    });

    if (!tradeCase) {
      return Response.json(
        {
          code: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const existingSavedCase =
      await prisma.savedCase.findUnique({
        where: {
          userId_caseId: {
            userId: user.id,
            caseId,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingSavedCase) {
      await prisma.savedCase.delete({
        where: {
          id: existingSavedCase.id,
        },
      });

      return Response.json({
        code: "CASE_REMOVED_FROM_SAVED",
        saved: false,
      });
    }

    await prisma.savedCase.create({
      data: {
        userId: user.id,
        caseId,
      },
    });

    return Response.json(
      {
        code: "CASE_SAVED",
        saved: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CASE_SAVE_TOGGLE_FAILED", error);

    return Response.json(
      {
        code: "CASE_SAVE_TOGGLE_FAILED",
      },
      { status: 500 },
    );
  }
}