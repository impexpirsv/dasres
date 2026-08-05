import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeCompanyLogoFile,
  storeCompanyLogoFile,
  type StoredCompanyLogo,
} from "../storage/company-logo-storage";
import { runInTransaction } from "../transactions";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_EMAIL_LENGTH = 254;
const MAX_WEBSITE_LENGTH = 2_048;

const COMPANY_SELECT = {
  id: true,
  name: true,
  country: true,
  category: true,
  status: true,
  description: true,
  email: true,
  website: true,
  logoUrl: true,
  verificationStatus: true,
  ownerId: true,
  createdAt: true,
} satisfies Prisma.CompanySelect;

export type CreatedCompany =
  Prisma.CompanyGetPayload<{
    select: typeof COMPANY_SELECT;
  }>;

export type CreateCompanyInput = {
  name: string;
  country: string;
  category: string;
  description: string;
  email: string;
  website: string;
  logoFile: File | null;
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
    const parsedUrl =
      new URL(value);

    return (
      parsedUrl.protocol ===
        "http:" ||
      parsedUrl.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

async function readCompanyFormData(
  request: Request,
): Promise<FormData> {
  const contentType =
    request.headers.get(
      "content-type",
    );

  if (
    contentType &&
    !contentType
      .toLowerCase()
      .includes(
        "multipart/form-data",
      )
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  try {
    return await request.formData();
  } catch {
    throw new AppError(
      "INVALID_FORM_DATA",
      400,
    );
  }
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
): CreateCompanyInput {
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
      "REQUIRED_COMPANY_FIELDS_MISSING",
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

export async function parseCreateCompanyInput(
  request: Request,
): Promise<CreateCompanyInput> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.IMAGE);

  const formData =
    await readCompanyFormData(
      request,
    );

  return parseCompanyFormData(
    formData,
  );
}

function mapCreateCompanyError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new AppError(
        "COMPANY_DUPLICATE_VALUE",
        409,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "COMPANY_OWNER_NOT_FOUND",
        409,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "COMPANY_CREATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function createCompany({
  authenticatedUserId,
  input,
}: {
  authenticatedUserId: number;
  input: CreateCompanyInput;
}): Promise<CreatedCompany> {
  let storedLogo:
    | StoredCompanyLogo
    | null = null;

  try {
    if (input.logoFile) {
      storedLogo =
        await storeCompanyLogoFile(
          input.logoFile,
        );
    }

    const company =
      await runInTransaction(
        async (transaction) => {
          const currentUser =
            await transaction.user.findUnique({
              where: {
                id:
                  authenticatedUserId,
              },
              select: {
                id: true,
              },
            });

          if (!currentUser) {
            throw new AppError(
              "USER_NOT_FOUND",
              404,
            );
          }

          return transaction.company.create({
            data: {
              name:
                input.name,
              country:
                input.country,
              category:
                input.category,
              status:
                "Active",
              description:
                input.description,
              email:
                input.email,
              website:
                input.website,
              logoUrl:
                storedLogo?.logoUrl ??
                null,
              ownerId:
                currentUser.id,
            },
            select:
              COMPANY_SELECT,
          });
        },
      );

    storedLogo = null;

    return company;
  } catch (error) {
    await removeCompanyLogoFile(
      storedLogo?.savedFilePath ??
      null,
    );

    mapCreateCompanyError(
      error,
    );
  }
}
