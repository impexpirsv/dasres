import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type SaveCompanyResult = {
  code:
    | "COMPANY_SAVED"
    | "COMPANY_UNSAVED";
  saved: boolean;
};

function mapSaveCompanyError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2003") {
      throw new AppError(
        "COMPANY_OR_USER_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "COMPANY_SAVE_NOT_FOUND",
        404,
      );
    }

    if (
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      throw new AppError(
        "COMPANY_SAVE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function toggleSavedCompany({
  userId,
  companyId,
}: {
  userId: number;
  companyId: number;
}): Promise<SaveCompanyResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const [user, company] =
          await Promise.all([
            transaction.user.findUnique({
              where: {
                id: userId,
              },
              select: {
                id: true,
              },
            }),
            transaction.company.findUnique({
              where: {
                id: companyId,
              },
              select: {
                id: true,
              },
            }),
          ]);

        if (!user) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (!company) {
          throw new AppError(
            "COMPANY_NOT_FOUND",
            404,
          );
        }

        const existingSave =
          await transaction.savedCompany.findUnique({
            where: {
              userId_companyId: {
                userId,
                companyId,
              },
            },
            select: {
              userId: true,
              companyId: true,
            },
          });

        if (existingSave) {
          await transaction.savedCompany.delete({
            where: {
              userId_companyId: {
                userId,
                companyId,
              },
            },
          });

          return {
            code: "COMPANY_UNSAVED",
            saved: false,
          };
        }

        await transaction.savedCompany.create({
          data: {
            userId,
            companyId,
          },
        });

        return {
          code: "COMPANY_SAVED",
          saved: true,
        };
      },
    );
  } catch (error) {
    mapSaveCompanyError(error);
  }
}
