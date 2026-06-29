import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { getProposalLimit } from "../../../../../lib/plans";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(id, "case id");

    const body = await request.json();

    const message = String(body.message || "").trim();
    const price = String(body.price || "").trim();

    const companyId = body.companyId ? Number(body.companyId) : null;
    const expertId = body.expertId ? Number(body.expertId) : null;

    if (!message) {
      throw new AppError("Proposal message is required.", 400);
    }

    if (!companyId || Number.isNaN(companyId)) {
      throw new AppError("Company is required.", 400);
    }

    if (expertId && Number.isNaN(expertId)) {
      throw new AppError("Invalid expert id.", 400);
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
    });

    if (!tradeCase) {
      throw new AppError("Case not found.", 404);
    }

    if (tradeCase.customerId === user.id && user.role !== "admin") {
      throw new AppError("You cannot submit a proposal for your own case.", 403);
    }

    if (tradeCase.status !== "OPEN") {
      throw new AppError("This case is not accepting proposals.", 400);
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        category: tradeCase.category,
        ...(user.role === "admin" ? {} : { ownerId: user.id }),
      },
      select: {
        id: true,
        ownerId: true,
        category: true,
        planType: true,
      },
    });

    if (!company) {
      throw new AppError(
        "Invalid company. Company must belong to you and match this case category.",
        403,
      );
    }

    if (expertId) {
      const expert = await prisma.expert.findFirst({
        where: {
          id: expertId,
          specialty: tradeCase.category,
          ...(user.role === "admin" ? {} : { ownerId: user.id }),
        },
        select: {
          id: true,
          ownerId: true,
          specialty: true,
          planType: true,
        },
      });

      if (!expert) {
        throw new AppError(
          "Invalid expert. Expert must belong to you and match this case category.",
          403,
        );
      }
    }

    const existingProposal = await prisma.caseProposal.findFirst({
      where: {
        caseId: tradeCase.id,
        companyId,
        expertId,
      },
    });

    if (existingProposal) {
      throw new AppError(
        expertId
          ? "This company and expert have already submitted a proposal for this case."
          : "This company has already submitted a proposal without an expert for this case.",
        400,
      );
    }

    const proposalLimit = getProposalLimit(user.planType);

    const proposalCount = await prisma.caseProposal.count({
      where: {
        OR: [
          {
            company: {
              ownerId: user.id,
            },
          },
          {
            expert: {
              ownerId: user.id,
            },
          },
        ],
      },
    });

    if (proposalCount >= proposalLimit) {
      throw new AppError(
        `Your current plan (${user.planType}) allows up to ${proposalLimit} proposals. Please upgrade your plan to submit more proposals.`,
        403,
      );
    }

    await prisma.$transaction(async (tx) => {
      const createdProposal = await tx.caseProposal.create({
        data: {
          caseId,
          companyId,
          expertId,
          message,
          price: price || null,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId,
          userId: user.id,
          action: "PROPOSAL_SUBMITTED",
          details: `Proposal #${createdProposal.id} submitted.`,
        },
      });

      await tx.notification.create({
        data: {
          userId: tradeCase.customerId,
          title: "New Proposal Received",
          message: "A new proposal has been submitted for your trade case.",
          type: "PROPOSAL_SUBMITTED",
          link: `/dashboard/cases/${tradeCase.id}`,
        },
      });
    });

    return Response.json({
      message: "Proposal created",
    });
  });
}