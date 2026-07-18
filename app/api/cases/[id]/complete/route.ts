import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(id, "case id");

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
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
        steps: true,
      },
    });

    if (!tradeCase) {
      throw new AppError("Case not found.", 404);
    }

    const isCustomer = tradeCase.customerId === user.id;

    const isAcceptedProvider = tradeCase.proposals.some(
      (proposal) =>
        proposal.company?.ownerId === user.id ||
        proposal.expert?.ownerId === user.id,
    );

    if (
      user.role !== "admin" &&
      !isCustomer &&
      !isAcceptedProvider
    ) {
      throw new AppError(
        "You are not allowed to complete this case.",
        403,
      );
    }

    if (tradeCase.status === "COMPLETED") {
      return Response.json({
        code: "CASE_ALREADY_COMPLETED",
      });
    }

    const hasIncompleteSteps = tradeCase.steps.some(
      (step) => !step.completed,
    );

    if (hasIncompleteSteps) {
      throw new AppError(
        "All case steps must be completed first.",
        400,
      );
    }

    const updatedCase = await prisma.$transaction(
      async (tx) => {
        const completedCase = await tx.tradeCase.update({
          where: {
            id: caseId,
          },
         data: {
  status: "COMPLETED",
},
        });

        await tx.project.updateMany({
          where: {
            tradeCaseId: caseId,
          },
          data: {
            status: "COMPLETED",
            progress: 100,
          },
        });

        await tx.caseActivity.create({
          data: {
            caseId,
            userId: user.id,
            action: "CASE_COMPLETED",
            details: `Case completed: ${tradeCase.title}`,
          },
        });

        return completedCase;
      },
    );

    return Response.json({
      code: "CASE_COMPLETED",
      tradeCase: updatedCase,
    });
  });
}