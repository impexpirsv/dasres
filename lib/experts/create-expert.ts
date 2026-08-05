import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeExpertImageFile,
  storeExpertImageFile,
  type StoredExpertImage,
} from "../storage/expert-image-storage";
import { runInTransaction } from "../transactions";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_SPECIALTY_LENGTH = 150;
const MAX_EXPERIENCE_LENGTH = 2_000;
const MAX_EMAIL_LENGTH = 254;

const EXPERT_SELECT = {
  id: true,
  name: true,
  country: true,
  specialty: true,
  status: true,
  experience: true,
  email: true,
  imageUrl: true,
  ownerId: true,
  verificationStatus: true,
  verifiedAt: true,
  createdAt: true,
} satisfies Prisma.ExpertSelect;

export type CreatedExpert =
  Prisma.ExpertGetPayload<{
    select: typeof EXPERT_SELECT;
  }>;

export type CreateExpertInput = {
  name: string;
  country: string;
  specialty: string;
  experience: string;
  email: string;
  imageFile: File | null;
};

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

async function readExpertFormData(
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

function getImageFile(
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
      "INVALID_EXPERT_IMAGE",
      400,
    );
  }

  if (imageValue.size === 0) {
    return null;
  }

  return imageValue;
}

function parseExpertFormData(
  formData: FormData,
): CreateExpertInput {
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

  const specialty =
    getFormText(
      formData,
      "specialty",
    );

  const experience =
    getFormText(
      formData,
      "experience",
    );

  const email =
    getFormText(
      formData,
      "email",
    ).toLowerCase();

  if (
    !name ||
    !country ||
    !specialty ||
    !experience ||
    !email
  ) {
    throw new AppError(
      "EXPERT_REQUIRED_FIELDS_MISSING",
      400,
    );
  }

  if (
    name.length >
      MAX_NAME_LENGTH ||
    country.length >
      MAX_COUNTRY_LENGTH ||
    specialty.length >
      MAX_SPECIALTY_LENGTH ||
    experience.length >
      MAX_EXPERIENCE_LENGTH ||
    email.length >
      MAX_EMAIL_LENGTH
  ) {
    throw new AppError(
      "EXPERT_FIELD_TOO_LONG",
      400,
    );
  }

  if (!isValidEmail(email)) {
    throw new AppError(
      "INVALID_EXPERT_EMAIL",
      400,
    );
  }

  return {
    name,
    country,
    specialty,
    experience,
    email,
    imageFile:
      getImageFile(formData),
  };
}

export async function parseCreateExpertInput(
  request: Request,
): Promise<CreateExpertInput> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.IMAGE);

  const formData =
    await readExpertFormData(
      request,
    );

  return parseExpertFormData(
    formData,
  );
}

function mapCreateExpertError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new AppError(
        "EXPERT_ALREADY_EXISTS",
        409,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "EXPERT_OWNER_NOT_FOUND",
        409,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "EXPERT_CREATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function createExpert({
  authenticatedUserId,
  input,
}: {
  authenticatedUserId: number;
  input: CreateExpertInput;
}): Promise<CreatedExpert> {
  let storedImage:
    | StoredExpertImage
    | null = null;

  try {
    if (input.imageFile) {
      storedImage =
        await storeExpertImageFile(
          input.imageFile,
        );
    }

    const expert =
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

          return transaction.expert.create({
            data: {
              name:
                input.name,
              country:
                input.country,
              specialty:
                input.specialty,
              status:
                "Active",
              experience:
                input.experience,
              email:
                input.email,
              imageUrl:
                storedImage?.imageUrl ??
                null,
              ownerId:
                currentUser.id,
            },
            select:
              EXPERT_SELECT,
          });
        },
      );

    storedImage = null;

    return expert;
  } catch (error) {
    await removeExpertImageFile(
      storedImage?.savedFilePath ??
      null,
    );

    mapCreateExpertError(
      error,
    );
  }
}
