import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import {
  storeExpertImageFile,
  type StoredExpertImage,
} from "../storage/expert-image-storage";
import { runInTransaction } from "../transactions";
import { parseBoundedMultipartFormData } from "../security/upload-request";
import { PUBLIC_IMAGE_LIMITS } from "../storage/public-image-storage";
import { createPublicImageUrl, removePublicImageBestEffort, type PublicImageDependencies } from "../storage/public-image-storage";

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
  return parseBoundedMultipartFormData(request, {
    maximumRequestBytes: PUBLIC_IMAGE_LIMITS.requestBytes,
    maximumFileBytes: PUBLIC_IMAGE_LIMITS.fileBytes,
    fileField: "image",
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
  imageDependencies,
}: {
  authenticatedUserId: number;
  input: CreateExpertInput;
  imageDependencies?: PublicImageDependencies;
}): Promise<CreatedExpert> {
  let storedImage:
    | StoredExpertImage
    | null = null;

  try {
    const authorizedUser = await prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { id: true } });
    if (!authorizedUser) throw new AppError("USER_NOT_FOUND", 404);

    if (input.imageFile) {
      storedImage =
        await storeExpertImageFile(
          input.imageFile,
          imageDependencies,
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

          const created = await transaction.expert.create({
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
              imageUrl: null,
              imageStorageKey: storedImage?.storageKey,
              imageStorageProvider: storedImage?.storageProvider,
              imageMimeType: storedImage?.mimeType,
              imageFileSize: storedImage?.fileSize,
              imageChecksumSha256: storedImage?.checksumSha256,
              imageScanStatus: storedImage?.scanStatus,
              imageScannedAt: storedImage?.scannedAt,
              imageScanEngine: storedImage?.scanEngine,
              imageScanAttempts: storedImage?.scanAttempts ?? 0,
              ownerId:
                currentUser.id,
            },
            select: { id: true },
          });

          return transaction.expert.update({
            where: { id: created.id },
            data: { imageUrl: storedImage ? createPublicImageUrl("expert", created.id) : null },
            select: EXPERT_SELECT,
          });
        },
      );

    storedImage = null;

    return expert;
  } catch (error) {
    await removePublicImageBestEffort(storedImage?.storageKey ?? null, imageDependencies?.storage);

    mapCreateExpertError(
      error,
    );
  }
}
