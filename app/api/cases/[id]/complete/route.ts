import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const stepId = Number(id);

    if (Number.isNaN(stepId)) {
      return Response.json(
        { message: "Invalid step id" },
        { status: 400 },
      );
    }

    const step = await prisma.caseStep.findUnique({
      where: {
        id: stepId,
      },
      include: {
        tradeCase: {
          include: {
            proposals: {
              where: {
                status: "ACCEPTED",
              },
              include: {
                company: true,
                expert: true,
              },
            },
          },
        },
      },
    });

    if (!step) {
      return Response.json(
        { message: "Step not found" },
        { status: 404 },
      );
    }

    const isCustomer = step.tradeCase.customerId === user.id;

    const isAcceptedProvider = step.tradeCase.proposals.some(
      (proposal) =>
        proposal.company?.ownerId === user.id ||
        proposal.expert?.ownerId === user.id,
    );

    if (user.role !== "admin" && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        { message: "You are not allowed to update this step." },
        { status: 403 },
      );
    }

    const updatedStep = await prisma.caseStep.update({
      where: {
        id: stepId,
      },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: step.tradeCase.id,
        userId: user.id,
        action: "STEP_COMPLETED",
        details: `Step completed: ${step.title}`,
      },
    });

    return Response.json({
      message: "Step completed",
      step: updatedStep,
    });
  } catch {
    return Response.json(
      { message: "Failed to complete step" },
      { status: 500 },
    );
  }
}