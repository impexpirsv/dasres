import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;

  const body = await request.json();

  await prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      planType: body.planType,
    },
  });

  return Response.json({
    message: "Plan updated",
  });
}