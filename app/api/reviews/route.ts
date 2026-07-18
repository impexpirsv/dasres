import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_REVIEW_COMMENT_LENGTH = 5000;

function parsePositiveInteger(
  value: unknown,
  errorCode: string,
) {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new AppError(errorCode, 400);
  }

  return parsedValue;
}

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    const user = await requireUser();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "INVALID_JSON_BODY",
        400,
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
      );
    }

    const payload = body as Record<
      string,
      unknown
    >;

    const caseId = parsePositiveInteger(
      payload.caseId,
      "INVALID_REVIEW_CASE_ID",
    );

    const reviewedUserId =
      parsePositiveInteger(
        payload.reviewedUserId,
        "INVALID_REVIEWED_USER_ID",
      );

    const rating = Number(payload.rating);

    const comment = String(
      payload.comment ?? "",
    ).trim();

    if (
      !Number.isInteger(rating) ||
      rating < MIN_RATING ||
      rating > MAX_RATING
    ) {
      throw new AppError(
        "INVALID_REVIEW_RATING",
        400,
      );
    }

    if (
      comment.length >
      MAX_REVIEW_COMMENT_LENGTH
    ) {
      throw new AppError(
        "REVIEW_COMMENT_TOO_LONG",
        400,
      );
    }

    if (reviewedUserId === user.id) {
      throw new AppError(
        "REVIEW_SELF_NOT_ALLOWED",
        400,
      );
    }

    const tradeCase =
      await prisma.tradeCase.findUnique({
        where: {
          id: caseId,
        },
        select: {
          id: true,
          status: true,
          customerId: true,
          proposals: {
            where: {
              status: "ACCEPTED",
            },
            take: 1,
            select: {
              id: true,
              company: {
                select: {
                  ownerId: true,
                },
              },
            },
          },
        },
      });

    if (!tradeCase) {
      throw new AppError(
        "TRADE_CASE_NOT_FOUND",
        404,
      );
    }

    if (tradeCase.status !== "COMPLETED") {
      throw new AppError(
        "REVIEW_CASE_NOT_COMPLETED",
        400,
      );
    }

    const acceptedProposal =
      tradeCase.proposals[0];

    const providerUserId =
      acceptedProposal?.company?.ownerId;

    if (!providerUserId) {
      throw new AppError(
        "REVIEW_PROVIDER_NOT_FOUND",
        400,
      );
    }

    const isCustomer =
      tradeCase.customerId === user.id;

    const isProvider =
      providerUserId === user.id;

    if (!isCustomer && !isProvider) {
      throw new AppError(
        "REVIEW_CREATE_NOT_ALLOWED",
        403,
      );
    }

    const expectedReviewedUserId =
      isCustomer
        ? providerUserId
        : tradeCase.customerId;

    if (
      reviewedUserId !==
      expectedReviewedUserId
    ) {
      throw new AppError(
        "REVIEW_TARGET_NOT_ALLOWED",
        403,
      );
    }

    const reviewedUser =
      await prisma.user.findUnique({
        where: {
          id: reviewedUserId,
        },
        select: {
          id: true,
        },
      });

    if (!reviewedUser) {
      throw new AppError(
        "REVIEWED_USER_NOT_FOUND",
        404,
      );
    }

    const existingReview =
      await prisma.review.findFirst({
        where: {
          caseId,
          reviewerId: user.id,
          reviewedUserId,
        },
        select: {
          id: true,
        },
      });

    if (existingReview) {
      throw new AppError(
        "REVIEW_ALREADY_SUBMITTED",
        409,
      );
    }

    try {
      const review =
        await prisma.$transaction(
          async (transaction) => {
            const createdReview =
              await transaction.review.create({
                data: {
                  caseId,
                  reviewerId: user.id,
                  reviewedUserId,
                  rating,
                  comment:
                    comment || null,
                },
                select: {
                  id: true,
                  caseId: true,
                  reviewerId: true,
                  reviewedUserId: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                },
              });

            await transaction.caseActivity.create({
              data: {
                caseId,
                userId: user.id,
                action:
                  "REVIEW_SUBMITTED",
                details: `A ${rating}-star review was submitted.`,
              },
            });

            return createdReview;
          },
        );

      return Response.json(
        {
          code: "REVIEW_SUBMITTED",
          review,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "REVIEW_ALREADY_SUBMITTED",
          409,
        );
      }

      console.error(
        "REVIEW_SUBMISSION_ERROR",
        {
          caseId,
          reviewerId: user.id,
          reviewedUserId,
          error,
        },
      );

      throw error;
    }
  });
}