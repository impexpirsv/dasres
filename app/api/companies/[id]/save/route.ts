import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();

  const { id } = await params;
  const companyId = Number(id);

  const existingSave =
    await prisma.savedCompany.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
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
    saved: true,
  });
}