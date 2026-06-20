import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;

  await prisma.expert.update({
    where: {
      id: Number(id),
    },
    data: {
      verificationStatus: "VERIFIED",
    },
  });

  return Response.json({
    message: "Expert verified",
  });
}