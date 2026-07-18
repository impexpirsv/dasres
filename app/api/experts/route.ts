import { randomUUID } from "crypto";
import {
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_SPECIALTY_LENGTH = 150;
const MAX_EXPERIENCE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function matchesImageSignature(
  buffer: Buffer,
  mimeType: string,
) {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") ===
        "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") ===
        "WEBP"
    );
  }

  return false;
}

async function removeUploadedFile(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error
        ? String(error.code)
        : null;

    if (errorCode !== "ENOENT") {
      console.error("EXPERT_IMAGE_CLEANUP_ERROR", {
        filePath,
        error,
      });
    }
  }
}

export async function POST(request: Request) {
  let uploadedFilePath: string | null = null;

  try {
    const user = await requireUser();

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        {
          code: "INVALID_FORM_DATA",
        },
        { status: 400 },
      );
    }

    const name = String(
      formData.get("name") ?? "",
    ).trim();

    const country = String(
      formData.get("country") ?? "",
    ).trim();

    const specialty = String(
      formData.get("specialty") ?? "",
    ).trim();

    const experience = String(
      formData.get("experience") ?? "",
    ).trim();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const imageValue = formData.get("image");

    if (
      !name ||
      !country ||
      !specialty ||
      !experience ||
      !email
    ) {
      return Response.json(
        {
          code: "EXPERT_REQUIRED_FIELDS_MISSING",
        },
        { status: 400 },
      );
    }

    if (
      name.length > MAX_NAME_LENGTH ||
      country.length > MAX_COUNTRY_LENGTH ||
      specialty.length > MAX_SPECIALTY_LENGTH ||
      experience.length > MAX_EXPERIENCE_LENGTH ||
      email.length > MAX_EMAIL_LENGTH
    ) {
      return Response.json(
        {
          code: "EXPERT_FIELD_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          code: "INVALID_EXPERT_EMAIL",
        },
        { status: 400 },
      );
    }

    if (
      imageValue !== null &&
      !(imageValue instanceof File)
    ) {
      return Response.json(
        {
          code: "INVALID_EXPERT_IMAGE",
        },
        { status: 400 },
      );
    }

    let imageUrl: string | null = null;

    if (
      imageValue instanceof File &&
      imageValue.size > 0
    ) {
      if (
        !ALLOWED_IMAGE_TYPES.has(imageValue.type)
      ) {
        return Response.json(
          {
            code: "INVALID_EXPERT_IMAGE_TYPE",
          },
          { status: 400 },
        );
      }

      if (imageValue.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            code: "EXPERT_IMAGE_TOO_LARGE",
            maxSizeBytes: MAX_FILE_SIZE,
          },
          { status: 400 },
        );
      }

      const fileExtension =
        IMAGE_EXTENSION_MAP[imageValue.type];

      if (!fileExtension) {
        return Response.json(
          {
            code: "INVALID_EXPERT_IMAGE_TYPE",
          },
          { status: 400 },
        );
      }

      const bytes = await imageValue.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (
        !matchesImageSignature(
          buffer,
          imageValue.type,
        )
      ) {
        return Response.json(
          {
            code: "INVALID_EXPERT_IMAGE_CONTENT",
          },
          { status: 400 },
        );
      }

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "experts",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const fileName = `${randomUUID()}.${fileExtension}`;

      uploadedFilePath = path.join(
        uploadDirectory,
        fileName,
      );

      await writeFile(uploadedFilePath, buffer, {
        flag: "wx",
      });

      imageUrl = `/uploads/experts/${fileName}`;
    }

    const expert = await prisma.expert.create({
      data: {
        name,
        country,
        specialty,
        status: "Active",
        experience,
        email,
        imageUrl,
        ownerId: user.id,
      },
      select: {
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
      },
    });

    uploadedFilePath = null;

    return Response.json(
      {
        code: "EXPERT_CREATED",
        expert,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedFilePath) {
      await removeUploadedFile(uploadedFilePath);
    }

    if (error instanceof Response) {
      return error;
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          code: "EXPERT_ALREADY_EXISTS",
        },
        { status: 409 },
      );
    }

    console.error("EXPERT_CREATE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "EXPERT_CREATE_FAILED",
      },
      { status: 500 },
    );
  }
}