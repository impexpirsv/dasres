import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import {
  removeCompanyLogoFile,
  resolveCompanyLogoFilePath,
  storeCompanyLogoFile,
  type StoredCompanyLogo,
} from "../storage/company-logo-storage";
import { runInTransaction } from "../transactions";
import { parseBoundedMultipartFormData } from "../security/upload-request";
import { PUBLIC_IMAGE_LIMITS } from "../storage/public-image-storage";
import { createPublicImageUrl, removePublicImageBestEffort, type PublicImageDependencies } from "../storage/public-image-storage";
import {
  COMPANY_DETAIL_SELECT,
  type CompanyDetail,
} from "./company-select";

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_EMAIL_LENGTH = 254;
const MAX_WEBSITE_LENGTH = 2_048;

export type UpdateCompanyInput = {
  name: string;
  country: string;
  category: string;
  description: string;
  email: string;
  website: string;
  logoFile: File | null;
};

export type UpdateCompanyResult = {
  company: CompanyDetail;
  changed: boolean;
};

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isValidWebsite(
  value: string,
): boolean {
  try {
    const parsedWebsite =
      new URL(value);

    return (
      parsedWebsite.protocol ===
        "http:" ||
      parsedWebsite.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

async function readCompanyFormData(
  request: Request,
): Promise<FormData> {
  return parseBoundedMultipartFormData(request, {
    maximumRequestBytes: PUBLIC_IMAGE_LIMITS.requestBytes,
    maximumFileBytes: PUBLIC_IMAGE_LIMITS.fileBytes,
    fileField: "logo",
  });
}

function getFormText(
  formData: FormData,
  fieldName: string,
): string {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function getLogoFile(
  formData: FormData,
): File | null {
  const logoValue =
    formData.get("logo");

  if (logoValue === null) {
    return null;
  }

  if (
    !(logoValue instanceof File)
  ) {
    throw new AppError(
      "INVALID_COMPANY_LOGO",
      400,
    );
  }

  if (logoValue.size === 0) {
    return null;
  }

  return logoValue;
}

function parseCompanyFormData(
  formData: FormData,
): UpdateCompanyInput {
  const name =
    getFormText(
      formData,
      "name",
    );

  const country =
    getFormText(
      formData,
      "country",
    );

  const category =
    getFormText(
      formData,
      "category",
    );

  const description =
    getFormText(
      formData,
      "description",
    );

  const email =
    getFormText(
      formData,
      "email",
    ).toLowerCase();

  const website =
    getFormText(
      formData,
      "website",
    );

  if (
    !name ||
    !country ||
    !category ||
    !description ||
    !email
  ) {
    throw new AppError(
      "COMPANY_REQUIRED_FIELDS_MISSING",
      400,
    );
  }

  if (
    name.length >
      MAX_NAME_LENGTH ||
    country.length >
      MAX_COUNTRY_LENGTH ||
    category.length >
      MAX_CATEGORY_LENGTH ||
    description.length >
      MAX_DESCRIPTION_LENGTH ||
    email.length >
      MAX_EMAIL_LENGTH ||
    website.length >
      MAX_WEBSITE_LENGTH
  ) {
    throw new AppError(
      "COMPANY_FIELD_TOO_LONG",
      400,
    );
  }

  if (!isValidEmail(email)) {
    throw new AppError(
      "INVALID_COMPANY_EMAIL",
      400,
    );
  }

  if (
    website &&
    !isValidWebsite(website)
  ) {
    throw new AppError(
      "INVALID_COMPANY_WEBSITE",
      400,
    );
  }

  return {
    name,
    country,
    category,
    description,
    email,
    website,
    logoFile:
      getLogoFile(formData),
  };
}

export async function parseUpdateCompanyInput(
  request: Request,
): Promise<UpdateCompanyInput> {
  const formData =
    await readCompanyFormData(
      request,
    );

  return parseCompanyFormData(
    formData,
  );
}

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

function companyHasChanged({
  company,
  input,
  logoUrl,
}: {
  company: CompanyDetail;
  input: UpdateCompanyInput;
  logoUrl: string | null;
}): boolean {
  return (
    company.name !==
      input.name ||
    company.country !==
      input.country ||
    company.category !==
      input.category ||
    company.description !==
      input.description ||
    company.email !==
      input.email ||
    company.website !==
      input.website ||
    company.logoUrl !==
      logoUrl
  );
}

function mapUpdateCompanyError(
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

    if (error.code === "P2002") {
      throw new AppError(
        "COMPANY_DUPLICATE_VALUE",
        409,
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
        "COMPANY_UPDATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function updateCompany({
  companyId,
  authenticatedUserId,
  input,
  imageDependencies,
}: {
  companyId: number;
  authenticatedUserId: number;
  input: UpdateCompanyInput;
  imageDependencies?: PublicImageDependencies;
}): Promise<UpdateCompanyResult> {
  let storedLogo:
    | StoredCompanyLogo
    | null = null;

  try {
    const authorized = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true, logoStorageKey: true },
    });
    const user = await prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { role: true } });
    if (!user) throw new AppError("AUTHENTICATED_USER_NOT_FOUND", 401);
    if (!authorized) throw new AppError("COMPANY_NOT_FOUND", 404);
    ensureCompanyPermission({ userId: authenticatedUserId, userRole: user.role, ownerId: authorized.ownerId });

    if (input.logoFile) {
      storedLogo =
        await storeCompanyLogoFile(
          input.logoFile,
          imageDependencies,
        );
    }

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

          const currentCompany =
            await transaction.company.findUnique({
              where: {
                id: companyId,
              },
              select: { ...COMPANY_DETAIL_SELECT, logoStorageKey: true },
            });

          if (!currentCompany) {
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
              currentCompany.ownerId,
          });

          const nextLogoUrl =
            (storedLogo ? createPublicImageUrl("company", companyId) : null) ??
            currentCompany.logoUrl;

          if (
            !storedLogo &&
            !companyHasChanged({
              company:
                currentCompany,
              input,
              logoUrl:
                nextLogoUrl,
            })
          ) {
            return {
              company:
                currentCompany,
              previousLogoUrl:
                currentCompany.logoUrl,
              previousStorageKey: currentCompany.logoStorageKey,
              changed: false,
            };
          }

          const company =
            await transaction.company.update({
              where: {
                id: companyId,
              },
              data: {
                name:
                  input.name,
                country:
                  input.country,
                category:
                  input.category,
                description:
                  input.description,
                email:
                  input.email,
                website:
                  input.website,
                logoUrl:
                  nextLogoUrl,
                ...(storedLogo ? {
                  logoStorageKey: storedLogo.storageKey,
                  logoStorageProvider: storedLogo.storageProvider,
                  logoMimeType: storedLogo.mimeType,
                  logoFileSize: storedLogo.fileSize,
                  logoChecksumSha256: storedLogo.checksumSha256,
                  logoScanStatus: storedLogo.scanStatus,
                  logoScannedAt: storedLogo.scannedAt,
                  logoScanEngine: storedLogo.scanEngine,
                  logoScanAttempts: storedLogo.scanAttempts,
                } : {}),
              },
              select:
                COMPANY_DETAIL_SELECT,
            });

          return {
            company,
            previousLogoUrl:
              currentCompany.logoUrl,
            previousStorageKey: currentCompany.logoStorageKey,
            changed: true,
          };
        },
      );

    const replacementStorageKey = storedLogo?.storageKey ?? null;

    if (
      storedLogo &&
      result.company.logoUrl !== createPublicImageUrl("company", companyId)
    ) {
      await removePublicImageBestEffort(storedLogo.storageKey, imageDependencies?.storage);

      storedLogo = null;
    }

    if (
      storedLogo &&
      result.company.logoUrl === createPublicImageUrl("company", companyId)
    ) {
      storedLogo = null;
    }

    if (
      result.changed &&
      result.previousLogoUrl &&
      result.previousLogoUrl !==
        result.company.logoUrl
    ) {
      await removeCompanyLogoFile(
        resolveCompanyLogoFilePath(
          result.previousLogoUrl,
        ),
      );
    }

    if (replacementStorageKey && result.changed && result.previousStorageKey && result.previousStorageKey !== replacementStorageKey) {
      await removePublicImageBestEffort(result.previousStorageKey, imageDependencies?.storage);
    }

    return {
      company:
        result.company,
      changed:
        result.changed,
    };
  } catch (error) {
    await removePublicImageBestEffort(storedLogo?.storageKey ?? null, imageDependencies?.storage);

    mapUpdateCompanyError(
      error,
    );
  }
}
