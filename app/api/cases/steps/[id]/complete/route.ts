import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;

    await prisma.caseStep.update({
      where: {
        id: Number(id),
      },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return Response.json({
      message: "Step completed",
    });
  } catch {
    return Response.json(
      { message: "Failed" },
      { status: 500 }
    );
  }
}