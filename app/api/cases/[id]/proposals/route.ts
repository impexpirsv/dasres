import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { getProposalLimit } from "../../../../../lib/plans";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyProposalSubmitted } from "../../../../../lib/notificationEvents";

const MAX_MESSAGE_LENGTH = 5000;
const MAX_PRICE_LENGTH = 100;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(id, "case id");

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError("INVALID_REQUEST_BODY", 400);
    }

    if (typeof body !== "object" || body === null) {
      throw new AppError("INVALID_REQUEST_BODY", 400);
    }

    const payload = body as Record<string, unknown>;

    const message = String(payload.message ?? "").trim();
    const price = String(payload.price ?? "").trim();

    const companyId =
      payload.companyId === null ||
      payload.companyId === undefined ||
      payload.companyId === ""
        ? null
        : Number(payload.companyId);

    const expertId =
      payload.expertId === null ||
      payload.expertId === undefined ||
      payload.expertId === ""
        ? null
        : Number(payload.expertId);

    if (!message) {
      throw new AppError("PROPOSAL_MESSAGE_REQUIRED", 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new AppError("PROPOSAL_MESSAGE_TOO_LONG", 400);
    }

    if (price.length > MAX_PRICE_LENGTH) {
      throw new AppError("PROPOSAL_PRICE_TOO_LONG", 400);
    }

    if (
      !Number.isInteger(companyId) ||
      companyId === null ||
      companyId <= 0
    ) {
      throw new AppError("INVALID_COMPANY_ID", 400);
    }

    if (
      expertId !== null &&
      (!Number.isInteger(expertId) || expertId <= 0)
    ) {
      throw new AppError("INVALID_EXPERT_ID", 400);
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      select: {
        id: true,
        title: true,
        customerId: true,
        category: true,
        status: true,
      },
    });

    if (!tradeCase) {
      throw new AppError("CASE_NOT_FOUND", 404);
    }

    if (
      tradeCase.customerId === user.id &&
      user.role !== "admin"
    ) {
      throw new AppError(
        "OWN_CASE_PROPOSAL_NOT_ALLOWED",
        403,
      );
    }

    if (tradeCase.status !== "OPEN") {
      throw new AppError(
        "CASE_NOT_ACCEPTING_PROPOSALS",
        400,
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
      },
    });

    if (!company) {
      throw new AppError(
        "INVALID_PROPOSAL_COMPANY",
        403,
      );
    }

    if (expertId !== null) {
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
        },
      });

      if (!expert) {
        throw new AppError(
          "INVALID_PROPOSAL_EXPERT",
          403,
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
        select: {
          id: true,
        },
      });

    if (existingProposal) {
      throw new AppError(
        expertId !== null
          ? "COMPANY_EXPERT_PROPOSAL_ALREADY_EXISTS"
          : "COMPANY_PROPOSAL_ALREADY_EXISTS",
        409,
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
        "PROPOSAL_PLAN_LIMIT_REACHED",
        403,
      );
    }

    const createdProposal = await prisma.$transaction(
      async (tx) => {
        const proposal = await tx.caseProposal.create({
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
            details: `Proposal #${proposal.id} submitted.`,
          },
        });

        return proposal;
      },
    );

    await notifyProposalSubmitted({
      userId: tradeCase.customerId,
      caseId: tradeCase.id,
    });

    return Response.json(
      {
        code: "PROPOSAL_CREATED",
        proposal: createdProposal,
        proposalLimit,
        proposalCount: proposalCount + 1,
      },
      { status: 201 },
    );
  });
}