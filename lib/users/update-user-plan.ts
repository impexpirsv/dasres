import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

const ALLOWED_PLANS = [
  "FREE",
  "GOLD",
  "DIAMOND",
  "ENTERPRISE",
] as const;

export type UserPlanType =
  (typeof ALLOWED_PLANS)[number];

export type UpdateUserPlanInput = {
  planType: UserPlanType;
};

export type UpdateUserPlanResult = {
  user: {
    id: number;
    planType: string;
  };
  alreadyUpdated: boolean;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  const contentType =
    request.headers.get(
      "content-type",
    );

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes(
        "application/json",
      )
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  try {
    return await request.json();
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
      400,
    );
  }
}

function validatePlanType(
  value: unknown,
): UserPlanType {
  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_PLAN_TYPE",
      400,
    );
  }

  const planType =
    value.trim().toUpperCase();

  if (
    !ALLOWED_PLANS.includes(
      planType as UserPlanType,
    )
  ) {
    throw new AppError(
      "INVALID_PLAN_TYPE",
      400,
    );
  }

  return planType as UserPlanType;
}

export async function parseUpdateUserPlanInput(
  request: Request,
): Promise<UpdateUserPlanInput> {
  const body =
    await readJsonBody(request);

  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return {
    planType:
      validatePlanType(
        body.planType,
      ),
  };
}

function mapUpdateUserPlanError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "PLAN_UPDATE_CONFLICT",
      409,
    );
  }

  throw error;
}

export async function updateUserPlan({
  userId,
  authenticatedAdminId,
  input,
}: {
  userId: number;
  authenticatedAdminId: number;
  input: UpdateUserPlanInput;
}): Promise<UpdateUserPlanResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const admin =
          await transaction.user.findUnique({
            where: {
              id:
                authenticatedAdminId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!admin) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        if (admin.role !== "admin") {
          throw new AppError(
            "ADMIN_ACCESS_REQUIRED",
            403,
          );
        }

        const user =
          await transaction.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              id: true,
              planType: true,
            },
          });

        if (!user) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (
          user.planType ===
          input.planType
        ) {
          return {
            user,
            alreadyUpdated: true,
          };
        }

        const updateResult =
          await transaction.user.updateMany({
            where: {
              id: user.id,
              planType: {
                not:
                  input.planType,
              },
            },
            data: {
              planType:
                input.planType,
            },
          });

        if (updateResult.count !== 1) {
          const currentUser =
            await transaction.user.findUnique({
              where: {
                id: user.id,
              },
              select: {
                id: true,
                planType: true,
              },
            });

          if (!currentUser) {
            throw new AppError(
              "USER_NOT_FOUND",
              404,
            );
          }

          if (
            currentUser.planType ===
            input.planType
          ) {
            return {
              user:
                currentUser,
              alreadyUpdated: true,
            };
          }

          throw new AppError(
            "PLAN_UPDATE_CONFLICT",
            409,
          );
        }

        const updatedUser =
          await transaction.user.findUnique({
            where: {
              id: user.id,
            },
            select: {
              id: true,
              planType: true,
            },
          });

        if (!updatedUser) {
          throw new AppError(
            "UPDATED_USER_NOT_FOUND",
            409,
          );
        }

        return {
          user: updatedUser,
          alreadyUpdated: false,
        };
      },
    );
  } catch (error) {
    mapUpdateUserPlanError(
      error,
    );
  }
}
