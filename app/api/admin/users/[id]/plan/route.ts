import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

const ALLOWED_PLANS = [
  "FREE",
  "GOLD",
  "DIAMOND",
  "ENTERPRISE",
] as const;

type PlanType = (typeof ALLOWED_PLANS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return Response.json(
        {
          code: "INVALID_USER_ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const planType = String(
      body?.planType ?? "",
    ).toUpperCase() as PlanType;

    if (!ALLOWED_PLANS.includes(planType)) {
      return Response.json(
        {
          code: "INVALID_PLAN_TYPE",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return Response.json(
        {
          code: "USER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        planType,
      },
    });

    return Response.json({
      code: "PLAN_UPDATED",
    });
  } catch {
    return Response.json(
      {
        code: "PLAN_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}