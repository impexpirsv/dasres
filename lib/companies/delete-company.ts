import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeCompanyLogoFile,
  resolveCompanyLogoFilePath,
} from "../storage/company-logo-storage";
import { runInTransaction } from "../transactions";
import { removePublicImageBestEffort } from "../storage/public-image-storage";
import type { SecureObjectStorage } from "../storage/secure-object-storage";

function ensureCompanyPermission({
  userId,
  userRole,
  ownerId,
}: {
  userId: number;
  userRole: string;
  ownerId: number | null;
}): void {
  if (
    userRole !== "admin" &&
    ownerId !== userId
  ) {
    throw new AppError(
      "COMPANY_ACCESS_DENIED",
      403,
    );
  }
}

function mapDeleteCompanyError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2025") {
      throw new AppError(
        "COMPANY_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "COMPANY_HAS_DEPENDENCIES",
        409,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "COMPANY_DELETE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function deleteCompany({
  companyId,
  authenticatedUserId,
  imageStorage,
}: {
  companyId: number;
  authenticatedUserId: number;
  imageStorage?: SecureObjectStorage;
}): Promise<void> {
  let logoUrl: string | null;
  let logoStorageKey: string | null;

  try {
    const result =
      await runInTransaction(
        async (transaction) => {
          const authenticatedUser =
            await transaction.user.findUnique({
              where: {
                id:
                  authenticatedUserId,
              },
              select: {
                id: true,
                role: true,
              },
            });

          if (!authenticatedUser) {
            throw new AppError(
              "AUTHENTICATED_USER_NOT_FOUND",
              401,
            );
          }

          const company =
            await transaction.company.findUnique({
              where: {
                id: companyId,
              },
              select: {
                id: true,
                logoUrl: true,
                logoStorageKey: true,
                ownerId: true,
              },
            });

          if (!company) {
            throw new AppError(
              "COMPANY_NOT_FOUND",
              404,
            );
          }

          ensureCompanyPermission({
            userId:
              authenticatedUser.id,
            userRole:
              authenticatedUser.role,
            ownerId:
              company.ownerId,
          });

          await transaction.company.delete({
            where: {
              id: company.id,
            },
          });

          return {
            logoUrl:
              company.logoUrl,
            logoStorageKey: company.logoStorageKey,
          };
        },
      );

    logoUrl = result.logoUrl;
    logoStorageKey = result.logoStorageKey;
  } catch (error) {
    mapDeleteCompanyError(
      error,
    );
  }

  await removeCompanyLogoFile(
    resolveCompanyLogoFilePath(
      logoUrl,
    ),
  );
  await removePublicImageBestEffort(logoStorageKey, imageStorage);
}
