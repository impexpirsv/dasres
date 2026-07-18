import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

function getExpertId(id: string) {
  const expertId = Number(id);

  if (
    !Number.isInteger(expertId) ||
    expertId <= 0
  ) {
    return null;
  }

  return expertId;
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
    const expertId = getExpertId(id);

    if (expertId === null) {
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

    const existingSave =
      await prisma.savedExpert.findUnique({
        where: {
          userId_expertId: {
            userId: user.id,
            expertId,
          },
        },
        select: {
          userId: true,
        },
      });

    if (existingSave) {
      await prisma.savedExpert.delete({
        where: {
          userId_expertId: {
            userId: user.id,
            expertId,
          },
        },
      });

      return Response.json({
        code: "EXPERT_UNSAVED",
        saved: false,
      });
    }

    await prisma.savedExpert.create({
      data: {
        userId: user.id,
        expertId,
      },
    });

    return Response.json({
      code: "EXPERT_SAVED",
      saved: true,
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json({
        code: "EXPERT_SAVED",
        saved: true,
      });
    }

    console.error("EXPERT_SAVE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "EXPERT_SAVE_FAILED",
      },
      { status: 500 },
    );
  }
}