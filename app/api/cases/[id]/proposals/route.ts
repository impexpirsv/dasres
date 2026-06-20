import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { getProposalLimit } from "../../../../../lib/plans";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);
    const body = await request.json();

    const message = String(body.message || "").trim();
    const price = String(body.price || "").trim();

    const companyId = body.companyId
      ? Number(body.companyId)
      : null;

    const expertId = body.expertId
      ? Number(body.expertId)
      : null;

    if (!message) {
      return Response.json(
        { message: "Proposal message is required" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return Response.json(
        { message: "Company is required" },
        { status: 400 }
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
    });

    if (!tradeCase) {
      return Response.json(
        { message: "Case not found" },
        { status: 404 }
      );
    }

    if (tradeCase.status !== "OPEN") {
      return Response.json(
        { message: "This case is not accepting proposals" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        category: tradeCase.category,
        ...(user.role === "admin"
          ? {}
          : {
              ownerId: user.id,
            }),
      },
      select: {
        id: true,
        ownerId: true,
        category: true,
        planType: true,
      },
    });

    if (!company) {
      return Response.json(
        {
          message:
            "Invalid company. Company must belong to you and match this case category.",
        },
        { status: 403 }
      );
    }

    

    if (expertId) {
      const expert = await prisma.expert.findFirst({
        where: {
          id: expertId,
          specialty: tradeCase.category,
          ...(user.role === "admin"
            ? {}
            : {
                ownerId: user.id,
              }),
        },
        select: {
          id: true,
          ownerId: true,
          specialty: true,
          planType: true,
        },
      });

      if (!expert) {
        return Response.json(
          {
            message:
              "Invalid expert. Expert must belong to you and match this case category.",
          },
          { status: 403 }
        );
      }

      
    }

    const existingProposal =
      await prisma.caseProposal.findFirst({
        where: {
          caseId: tradeCase.id,
          companyId,
          expertId,
        },
      });

    if (existingProposal) {
      return Response.json(
        {
          message: expertId
            ? "This company and expert have already submitted a proposal for this case."
            : "This company has already submitted a proposal without an expert for this case.",
        },
        { status: 400 }
      );
    }

    const proposalLimit =
  getProposalLimit(user.planType);

    const proposalCount =
      await prisma.caseProposal.count({
        where: {
          company: {
            ownerId: user.id,
          },
        },
      });

    if (proposalCount >= proposalLimit) {
      return Response.json(
        {
          message: `Your current plan (${user.planType}) allows up to ${proposalLimit} proposals. Please upgrade your plan to submit more proposals.`,
        },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const createdProposal =
        await tx.caseProposal.create({
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
          message:
            "A new proposal has been submitted for your trade case.",
          type: "PROPOSAL_SUBMITTED",
          link: `/dashboard/cases/${tradeCase.id}`,
        },
      });
    });

    return Response.json({
      message: "Proposal created",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to create proposal" },
      { status: 500 }
    );
  }
}