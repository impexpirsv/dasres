import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeOpportunityImageFile,
  storeOpportunityImageFile,
  type StoredOpportunityImage,
} from "../storage/opportunity-image-storage";
import { runInTransaction } from "../transactions";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";
import {
  OPPORTUNITY_SELECT,
  type OpportunityResponse,
} from "./opportunity-select";

const MAX_TITLE_LENGTH = 200;
const MAX_COUNTRY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5_000;

export type CreateOpportunityInput = {
  title: string;
  country: string;
  description: string;
  imageFile: File | null;
};

async function readOpportunityFormData(
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

function getRequiredTextField(
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

function getOpportunityImage(
  formData: FormData,
): File | null {
  const imageValue =
    formData.get("image");

  if (imageValue === null) {
    return null;
  }

  if (
    !(imageValue instanceof File)
  ) {
    throw new AppError(
      "INVALID_OPPORTUNITY_IMAGE",
      400,
    );
  }

  if (imageValue.size === 0) {
    return null;
  }

  return imageValue;
}

function parseOpportunityFormData(
  formData: FormData,
): CreateOpportunityInput {
  const title =
    getRequiredTextField(
      formData,
      "title",
    );

  const country =
    getRequiredTextField(
      formData,
      "country",
    );

  const description =
    getRequiredTextField(
      formData,
      "description",
    );

  if (
    !title ||
    !country ||
    !description
  ) {
    throw new AppError(
      "OPPORTUNITY_REQUIRED_FIELDS_MISSING",
      400,
    );
  }

  if (
    title.length >
    MAX_TITLE_LENGTH
  ) {
    throw new AppError(
      "OPPORTUNITY_TITLE_TOO_LONG",
      400,
    );
  }

  if (
    country.length >
    MAX_COUNTRY_LENGTH
  ) {
    throw new AppError(
      "OPPORTUNITY_COUNTRY_TOO_LONG",
      400,
    );
  }

  if (
    description.length >
    MAX_DESCRIPTION_LENGTH
  ) {
    throw new AppError(
      "OPPORTUNITY_DESCRIPTION_TOO_LONG",
      400,
    );
  }

  return {
    title,
    country,
    description,
    imageFile:
      getOpportunityImage(
        formData,
      ),
  };
}

export async function parseCreateOpportunityInput(
  request: Request,
): Promise<CreateOpportunityInput> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.IMAGE);

  const formData =
    await readOpportunityFormData(
      request,
    );

  return parseOpportunityFormData(
    formData,
  );
}

function mapCreateOpportunityError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new AppError(
        "OPPORTUNITY_ALREADY_EXISTS",
        409,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "OPPORTUNITY_RELATION_INVALID",
        400,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "ADMIN_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "OPPORTUNITY_CREATE_CONFLICT",
        409,
      );
    }
  }

  if (
    error instanceof
    Prisma.PrismaClientValidationError
  ) {
    throw new AppError(
      "INVALID_OPPORTUNITY_DATA",
      400,
    );
  }

  throw error;
}

export async function createOpportunity({
  authenticatedAdminId,
  input,
}: {
  authenticatedAdminId: number;
  input: CreateOpportunityInput;
}): Promise<OpportunityResponse> {
  let storedImage:
    | StoredOpportunityImage
    | null = null;

  try {
    if (input.imageFile) {
      storedImage =
        await storeOpportunityImageFile(
          input.imageFile,
        );
    }

    const opportunity =
      await runInTransaction(
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
              "ADMIN_NOT_FOUND",
              404,
            );
          }

          if (admin.role !== "admin") {
            throw new AppError(
              "ADMIN_ACCESS_REQUIRED",
              403,
            );
          }

          return transaction.opportunity.create({
            data: {
              title:
                input.title,
              country:
                input.country,
              status:
                "Open",
              description:
                input.description,
              imageUrl:
                storedImage?.imageUrl ??
                null,
            },
            select:
              OPPORTUNITY_SELECT,
          });
        },
      );

    storedImage = null;

    return opportunity;
  } catch (error) {
    await removeOpportunityImageFile(
      storedImage?.absolutePath ??
      null,
    );

    mapCreateOpportunityError(
      error,
    );
  }
}
