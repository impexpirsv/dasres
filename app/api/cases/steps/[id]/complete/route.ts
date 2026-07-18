import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();

    const { id } = await params;
    const stepId = Number(id);

    if (!Number.isInteger(stepId) || stepId <= 0) {
      return Response.json(
        {
          code: "INVALID_CASE_STEP_ID",
        },
        { status: 400 },
      );
    }

    const step = await prisma.caseStep.findUnique({
      where: {
        id: stepId,
      },
      select: {
        id: true,
        completed: true,
      },
    });

    if (!step) {
      return Response.json(
        {
          code: "CASE_STEP_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (step.completed) {
      return Response.json({
        code: "CASE_STEP_ALREADY_COMPLETED",
      });
    }

    await prisma.caseStep.update({
      where: {
        id: stepId,
      },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return Response.json({
      code: "CASE_STEP_COMPLETED",
    });
  } catch {
    return Response.json(
      {
        code: "CASE_STEP_COMPLETE_FAILED",
      },
      { status: 500 },
    );
  }
}