import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();

  const { id } = await params;
  const caseId = Number(id);

  if (!caseId || Number.isNaN(caseId)) {
    return Response.json(
      { message: "Invalid case id" },
      { status: 400 }
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
    });

  if (existingSavedCase) {
    await prisma.savedCase.delete({
      where: {
        id: existingSavedCase.id,
      },
    });

    return Response.json({
      message: "Case removed from saved cases",
      saved: false,
    });
  }

  await prisma.savedCase.create({
    data: {
      userId: user.id,
      caseId,
    },
  });

  return Response.json({
    message: "Case saved",
    saved: true,
  });
}