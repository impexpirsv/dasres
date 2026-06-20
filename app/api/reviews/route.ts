import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    const caseId = Number(body.caseId);
    const reviewedUserId = Number(body.reviewedUserId);
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!caseId || !reviewedUserId || !rating) {
      return Response.json(
        { message: "Case, reviewed user and rating are required." },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { message: "Rating must be between 1 and 5." },
        { status: 400 },
      );
    }

    if (reviewedUserId === user.id) {
      return Response.json(
        { message: "You cannot review yourself." },
        { status: 400 },
      );
    }

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
          },
        },
      },
    });

    if (!tradeCase) {
      return Response.json({ message: "Case not found." }, { status: 404 });
    }

    if (tradeCase.status !== "COMPLETED") {
      return Response.json(
        { message: "Only completed cases can be reviewed." },
        { status: 400 },
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    if (!acceptedProposal?.company?.ownerId) {
      return Response.json(
        { message: "Accepted proposal owner not found." },
        { status: 400 },
      );
    }

    const isCustomer = tradeCase.customerId === user.id;
    const isProvider = acceptedProposal.company.ownerId === user.id;
    const expectedReviewedUserId = isCustomer
      ? acceptedProposal.company.ownerId
      : tradeCase.customerId;
    if (!isCustomer && !isProvider) {
      return Response.json(
        { message: "You are not allowed to review this case." },
        { status: 403 },
      );
    }

    if (reviewedUserId !== expectedReviewedUserId) {
  return Response.json(
    {
      message:
        "You can only review the opposite party in this completed case.",
    },
    { status: 403 }
  );
}

    const existingReview = await prisma.review.findFirst({
      where: {
        caseId,
        reviewerId: user.id,
        reviewedUserId,
      },
    });

    if (existingReview) {
      return Response.json(
        { message: "You have already reviewed this user for this case." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
  await tx.review.create({
    data: {
      caseId,
      reviewerId: user.id,
      reviewedUserId,
      rating,
      comment: comment || null,
    },
  });

  await tx.caseActivity.create({
    data: {
      caseId,
      userId: user.id,
      action: "REVIEW_SUBMITTED",
      details: `${user.name || user.email} submitted a ${rating}-star review.`,
    },
  });
});

    return Response.json({
      message: "Review submitted.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to submit review." },
      { status: 500 },
    );
  }
}
