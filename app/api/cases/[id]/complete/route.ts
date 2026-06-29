import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const stepId = parseId(id, "step id");

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
      throw new AppError("Step not found.", 404);
    }

    const isCustomer = step.tradeCase.customerId === user.id;

    const isAcceptedProvider = step.tradeCase.proposals.some(
      (proposal) =>
        proposal.company?.ownerId === user.id ||
        proposal.expert?.ownerId === user.id,
    );

    if (user.role !== "admin" && !isCustomer && !isAcceptedProvider) {
      throw new AppError("You are not allowed to update this step.", 403);
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
  });
}