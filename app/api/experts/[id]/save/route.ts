import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();

  const { id } = await params;
  const expertId = Number(id);

  const existingSave =
    await prisma.savedExpert.findUnique({
      where: {
        userId_expertId: {
          userId: user.id,
          expertId,
        },
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

    return Response.json({ saved: false });
  }

  await prisma.savedExpert.create({
    data: {
      userId: user.id,
      expertId,
    },
  });

  return Response.json({ saved: true });
}