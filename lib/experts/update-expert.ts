import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeExpertImageFile,
  resolveExpertImageFilePath,
  storeExpertImageFile,
  type StoredExpertImage,
} from "../storage/expert-image-storage";
import { runInTransaction } from "../transactions";
import { assertUploadRequestSize, UPLOAD_REQUEST_LIMITS } from "../security/upload-request";
import {
  EXPERT_DETAIL_SELECT,
  type ExpertDetail,
} from "./expert-select";

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_SPECIALTY_LENGTH = 150;
const MAX_EXPERIENCE_LENGTH = 2_000;
const MAX_EMAIL_LENGTH = 254;

export type UpdateExpertInput = {
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
    !contentType ||
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
): UpdateExpertInput {
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
    MAX_NAME_LENGTH
  ) {
    throw new AppError(
      "EXPERT_NAME_TOO_LONG",
      400,
    );
  }

  if (
    country.length >
    MAX_COUNTRY_LENGTH
  ) {
    throw new AppError(
      "EXPERT_COUNTRY_TOO_LONG",
      400,
    );
  }

  if (
    specialty.length >
    MAX_SPECIALTY_LENGTH
  ) {
    throw new AppError(
      "EXPERT_SPECIALTY_TOO_LONG",
      400,
    );
  }

  if (
    experience.length >
    MAX_EXPERIENCE_LENGTH
  ) {
    throw new AppError(
      "EXPERT_EXPERIENCE_TOO_LONG",
      400,
    );
  }

  if (
    email.length >
      MAX_EMAIL_LENGTH ||
    !isValidEmail(email)
  ) {
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

export async function parseUpdateExpertInput(
  request: Request,
): Promise<UpdateExpertInput> {
  assertUploadRequestSize(request, UPLOAD_REQUEST_LIMITS.IMAGE);

  const formData =
    await readExpertFormData(
      request,
    );

  return parseExpertFormData(
    formData,
  );
}

function ensureExpertPermission({
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
      "EXPERT_UPDATE_FORBIDDEN",
      403,
    );
  }
}

function mapUpdateExpertError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2025") {
      throw new AppError(
        "EXPERT_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2002") {
      throw new AppError(
        "EXPERT_ALREADY_EXISTS",
        409,
      );
    }

    if (
      error.code === "P2003" ||
      error.code === "P2034"
    ) {
      throw new AppError(
        "EXPERT_UPDATE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function updateExpert({
  expertId,
  authenticatedUserId,
  input,
}: {
  expertId: number;
  authenticatedUserId: number;
  input: UpdateExpertInput;
}): Promise<ExpertDetail> {
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

    const result =
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
                role: true,
              },
            });

          if (!currentUser) {
            throw new AppError(
              "USER_NOT_FOUND",
              404,
            );
          }

          const currentExpert =
            await transaction.expert.findUnique({
              where: {
                id: expertId,
              },
              select: {
                id: true,
                ownerId: true,
                imageUrl: true,
              },
            });

          if (!currentExpert) {
            throw new AppError(
              "EXPERT_NOT_FOUND",
              404,
            );
          }

          ensureExpertPermission({
            userId:
              currentUser.id,
            userRole:
              currentUser.role,
            ownerId:
              currentExpert.ownerId,
          });

          const expert =
            await transaction.expert.update({
              where: {
                id: expertId,
              },
              data: {
                name:
                  input.name,
                country:
                  input.country,
                specialty:
                  input.specialty,
                experience:
                  input.experience,
                email:
                  input.email,
                ...(storedImage
                  ? {
                      imageUrl:
                        storedImage.imageUrl,
                    }
                  : {}),
              },
              select:
                EXPERT_DETAIL_SELECT,
            });

          return {
            expert,
            previousImageUrl:
              currentExpert.imageUrl,
          };
        },
      );

    const previousImagePath =
      storedImage
        ? resolveExpertImageFilePath(
            result.previousImageUrl,
          )
        : null;

    storedImage = null;

    if (previousImagePath) {
      await removeExpertImageFile(
        previousImagePath,
      );
    }

    return result.expert;
  } catch (error) {
    await removeExpertImageFile(
      storedImage?.savedFilePath ??
      null,
    );

    mapUpdateExpertError(
      error,
    );
  }
}
