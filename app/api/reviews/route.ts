import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import { requireUser } from "../../../lib/auth";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

const MAX_TRANSACTION_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 50;

const MAX_REQUEST_BODY_SIZE =
  16 * 1024;

const MIN_RATING = 1;
const MAX_RATING = 5;

const MAX_REVIEW_COMMENT_LENGTH =
  5000;

type ReviewInput = {
  caseId: number;
  reviewedUserId: number;
  rating: number;
  comment: string | null;
};

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isRetryableTransactionError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function runSerializableTransaction<T>(
  operation: (
    transaction:
      Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <=
    MAX_TRANSACTION_RETRIES;
    attempt += 1
  ) {
    try {
      return await prisma.$transaction(
        operation,
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,
        },
      );
    } catch (error) {
      const retryable =
        isRetryableTransactionError(
          error,
        );

      if (
        !retryable ||
        attempt ===
          MAX_TRANSACTION_RETRIES
      ) {
        if (retryable) {
          throw new AppError(
            "REVIEW_SUBMISSION_CONFLICT",
            409,
          );
        }

        throw error;
      }

      const retryDelay =
        BASE_RETRY_DELAY_MS *
        2 ** (attempt - 1);

      await sleep(retryDelay);
    }
  }

  throw new AppError(
    "REVIEW_SUBMISSION_CONFLICT",
    409,
  );
}

function validateContentLength(
  request: Request,
): void {
  const contentLengthHeader =
    request.headers.get(
      "content-length",
    );

  if (!contentLengthHeader) {
    return;
  }

  const contentLength = Number(
    contentLengthHeader,
  );

  if (
    !Number.isInteger(contentLength) ||
    contentLength < 0
  ) {
    throw new AppError(
      "INVALID_CONTENT_LENGTH",
      400,
    );
  }

  if (
    contentLength >
    MAX_REQUEST_BODY_SIZE
  ) {
    throw new AppError(
      "REQUEST_BODY_TOO_LARGE",
      413,
    );
  }
}

async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  validateContentLength(request);

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

  return body as Record<
    string,
    unknown
  >;
}

function parsePositiveInteger(
  value: unknown,
  errorCode: string,
): number {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  const parsedValue = Number(value);

  if (
    !Number.isSafeInteger(
      parsedValue,
    ) ||
    parsedValue <= 0
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  return parsedValue;
}

function validateReviewInput(
  payload: Record<string, unknown>,
): ReviewInput {
  const caseId =
    parsePositiveInteger(
      payload.caseId,
      "INVALID_REVIEW_CASE_ID",
    );

  const reviewedUserId =
    parsePositiveInteger(
      payload.reviewedUserId,
      "INVALID_REVIEWED_USER_ID",
    );

  const rating =
    parsePositiveInteger(
      payload.rating,
      "INVALID_REVIEW_RATING",
    );

  if (
    rating < MIN_RATING ||
    rating > MAX_RATING
  ) {
    throw new AppError(
      "INVALID_REVIEW_RATING",
      400,
    );
  }

  if (
    payload.comment !== undefined &&
    payload.comment !== null &&
    typeof payload.comment !== "string"
  ) {
    throw new AppError(
      "INVALID_REVIEW_COMMENT",
      400,
    );
  }

  const normalizedComment =
    typeof payload.comment === "string"
      ? payload.comment.trim()
      : "";

  if (
    normalizedComment.length >
    MAX_REVIEW_COMMENT_LENGTH
  ) {
    throw new AppError(
      "REVIEW_COMMENT_TOO_LONG",
      400,
    );
  }

  return {
    caseId,
    reviewedUserId,
    rating,
    comment:
      normalizedComment || null,
  };
}

function mapReviewMutationError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new AppError(
        "REVIEW_ALREADY_SUBMITTED",
        409,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "REVIEW_RELATION_CONFLICT",
        409,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "REVIEW_RESOURCE_NOT_FOUND",
        404,
      );
    }
  }

  if (
    error instanceof
    Prisma.PrismaClientValidationError
  ) {
    throw new AppError(
      "INVALID_REVIEW_DATA",
      400,
    );
  }

  throw error;
}

async function createReview({
  reviewerId,
  input,
}: {
  reviewerId: number;
  input: ReviewInput;
}) {
  try {
    return await runSerializableTransaction(
      async (transaction) => {
        const reviewer =
          await transaction.user.findUnique({
            where: {
              id: reviewerId,
            },
            select: {
              id: true,
            },
          });

        if (!reviewer) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (
          input.reviewedUserId ===
          reviewer.id
        ) {
          throw new AppError(
            "REVIEW_SELF_NOT_ALLOWED",
            400,
          );
        }

        const tradeCase =
          await transaction.tradeCase.findUnique({
            where: {
              id: input.caseId,
            },
            select: {
              id: true,
              status: true,
              customerId: true,
              proposals: {
                where: {
                  status: "ACCEPTED",
                },
                take: 2,
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

        if (
          tradeCase.status !==
          "COMPLETED"
        ) {
          throw new AppError(
            "REVIEW_CASE_NOT_COMPLETED",
            400,
          );
        }

        if (
          tradeCase.proposals.length >
          1
        ) {
          throw new AppError(
            "REVIEW_MULTIPLE_ACCEPTED_PROPOSALS",
            409,
          );
        }

        const acceptedProposal =
          tradeCase.proposals[0];

        const providerUserId =
          acceptedProposal?.company
            ?.ownerId;

        if (!providerUserId) {
          throw new AppError(
            "REVIEW_PROVIDER_NOT_FOUND",
            400,
          );
        }

        const isCustomer =
          tradeCase.customerId ===
          reviewer.id;

        const isProvider =
          providerUserId ===
          reviewer.id;

        if (
          !isCustomer &&
          !isProvider
        ) {
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
          input.reviewedUserId !==
          expectedReviewedUserId
        ) {
          throw new AppError(
            "REVIEW_TARGET_NOT_ALLOWED",
            403,
          );
        }

        const reviewedUser =
          await transaction.user.findUnique({
            where: {
              id: input.reviewedUserId,
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
          await transaction.review.findFirst({
            where: {
              caseId:
                tradeCase.id,
              reviewerId:
                reviewer.id,
              reviewedUserId:
                reviewedUser.id,
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

        const review =
          await transaction.review.create({
            data: {
              caseId:
                tradeCase.id,
              reviewerId:
                reviewer.id,
              reviewedUserId:
                reviewedUser.id,
              rating:
                input.rating,
              comment:
                input.comment,
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
            caseId:
              tradeCase.id,
            userId:
              reviewer.id,
            action:
              "REVIEW_SUBMITTED",
            details: JSON.stringify({
              reviewId: review.id,
              reviewedUserId:
                reviewedUser.id,
              rating:
                review.rating,
            }),
          },
          select: {
            id: true,
          },
        });

        return review;
      },
    );
  } catch (error) {
    console.error(
      "REVIEW_SUBMISSION_ERROR",
      {
        caseId: input.caseId,
        reviewerId,
        reviewedUserId:
          input.reviewedUserId,
        error,
      },
    );

    mapReviewMutationError(error);
  }
}

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const payload =
      await parseJsonBody(
        request,
      );

    const input =
      validateReviewInput(
        payload,
      );

    const review =
      await createReview({
        reviewerId: user.id,
        input,
      });

    return Response.json(
      {
        code:
          "REVIEW_SUBMITTED",
        review,
      },
      {
        status: 201,
      },
    );
  });
}