import { randomUUID } from "crypto";
import {
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_SPECIALTY_LENGTH = 150;
const MAX_EXPERIENCE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;

const EXPERT_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "experts",
);

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

type AuthenticatedUser = {
  id: number;
  role: string;
};

function parseExpertId(id: string) {
  const expertId = Number(id);

  if (
    !Number.isInteger(expertId) ||
    expertId <= 0
  ) {
    return null;
  }

  return expertId;
}

function canManageExpert(
  user: AuthenticatedUser,
  ownerId: number | null,
) {
  return (
    user.role === "admin" ||
    ownerId === user.id
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
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
      buffer
        .subarray(0, 4)
        .toString("ascii") === "RIFF" &&
      buffer
        .subarray(8, 12)
        .toString("ascii") === "WEBP"
    );
  }

  return false;
}

function getLocalUploadPath(
  fileUrl: string | null,
) {
  if (
    !fileUrl ||
    !fileUrl.startsWith("/uploads/experts/")
  ) {
    return null;
  }

  const fileName = path.basename(fileUrl);

  if (
    !fileName ||
    fileName !==
      fileUrl.slice(
        "/uploads/experts/".length,
      )
  ) {
    return null;
  }

  const resolvedPath = path.resolve(
    EXPERT_UPLOAD_DIRECTORY,
    fileName,
  );

  const resolvedUploadDirectory =
    path.resolve(EXPERT_UPLOAD_DIRECTORY);

  if (
    !resolvedPath.startsWith(
      `${resolvedUploadDirectory}${path.sep}`,
    )
  ) {
    return null;
  }

  return resolvedPath;
}

async function removeUploadedFile(
  filePath: string,
  logCode: string,
) {
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
      console.error(logCode, {
        filePath,
        error,
      });
    }
  }
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;
    const expertId = parseExpertId(id);

    if (expertId === null) {
      return Response.json(
        {
          code: "INVALID_EXPERT_ID",
        },
        { status: 400 },
      );
    }

    const expert =
      await prisma.expert.findUnique({
        where: {
          id: expertId,
        },
      });

    if (!expert) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return Response.json({
      code: "EXPERT_LOADED",
      expert,
    });
  } catch (error) {
    console.error("EXPERT_GET_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "EXPERT_LOAD_FAILED",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  let newUploadedFilePath: string | null =
    null;

  try {
    const user = await requireUser();

    const { id } = await params;
    const expertId = parseExpertId(id);

    if (expertId === null) {
      return Response.json(
        {
          code: "INVALID_EXPERT_ID",
        },
        { status: 400 },
      );
    }

    const currentExpert =
      await prisma.expert.findUnique({
        where: {
          id: expertId,
        },
        select: {
          id: true,
          imageUrl: true,
          ownerId: true,
        },
      });

    if (!currentExpert) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      !canManageExpert(
        user,
        currentExpert.ownerId,
      )
    ) {
      return Response.json(
        {
          code: "EXPERT_UPDATE_FORBIDDEN",
        },
        { status: 403 },
      );
    }

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

    if (name.length > MAX_NAME_LENGTH) {
      return Response.json(
        {
          code: "EXPERT_NAME_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      country.length > MAX_COUNTRY_LENGTH
    ) {
      return Response.json(
        {
          code: "EXPERT_COUNTRY_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      specialty.length >
      MAX_SPECIALTY_LENGTH
    ) {
      return Response.json(
        {
          code: "EXPERT_SPECIALTY_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      experience.length >
      MAX_EXPERIENCE_LENGTH
    ) {
      return Response.json(
        {
          code: "EXPERT_EXPERIENCE_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      email.length > MAX_EMAIL_LENGTH ||
      !isValidEmail(email)
    ) {
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

    let imageUrl = currentExpert.imageUrl;

    if (
      imageValue instanceof File &&
      imageValue.size > 0
    ) {
      if (
        !ALLOWED_IMAGE_TYPES.has(
          imageValue.type,
        )
      ) {
        return Response.json(
          {
            code: "INVALID_EXPERT_IMAGE_TYPE",
          },
          { status: 400 },
        );
      }

      if (
        imageValue.size > MAX_FILE_SIZE
      ) {
        return Response.json(
          {
            code: "EXPERT_IMAGE_TOO_LARGE",
            maxSizeBytes: MAX_FILE_SIZE,
          },
          { status: 400 },
        );
      }

      const extension =
        IMAGE_EXTENSION_MAP[imageValue.type];

      if (!extension) {
        return Response.json(
          {
            code: "INVALID_EXPERT_IMAGE_TYPE",
          },
          { status: 400 },
        );
      }

      const bytes =
        await imageValue.arrayBuffer();

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

      await mkdir(EXPERT_UPLOAD_DIRECTORY, {
        recursive: true,
      });

      const fileName = `${randomUUID()}.${extension}`;

      newUploadedFilePath = path.join(
        EXPERT_UPLOAD_DIRECTORY,
        fileName,
      );

      await writeFile(
        newUploadedFilePath,
        buffer,
        {
          flag: "wx",
        },
      );

      imageUrl = `/uploads/experts/${fileName}`;
    }

    const expert =
      await prisma.expert.update({
        where: {
          id: expertId,
        },
        data: {
          name,
          country,
          specialty,
          experience,
          email,
          imageUrl,
        },
      });

    const oldFilePath =
      newUploadedFilePath
        ? getLocalUploadPath(
            currentExpert.imageUrl,
          )
        : null;

    newUploadedFilePath = null;

    if (oldFilePath) {
      await removeUploadedFile(
        oldFilePath,
        "EXPERT_OLD_IMAGE_CLEANUP_ERROR",
      );
    }

    return Response.json({
      code: "EXPERT_UPDATED",
      expert,
    });
  } catch (error) {
    if (newUploadedFilePath) {
      await removeUploadedFile(
        newUploadedFilePath,
        "EXPERT_NEW_IMAGE_CLEANUP_ERROR",
      );
    }

    if (error instanceof Response) {
      return error;
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
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

    console.error("EXPERT_UPDATE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "EXPERT_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const expertId = parseExpertId(id);

    if (expertId === null) {
      return Response.json(
        {
          code: "INVALID_EXPERT_ID",
        },
        { status: 400 },
      );
    }

    const expert =
      await prisma.expert.findUnique({
        where: {
          id: expertId,
        },
        select: {
          id: true,
          imageUrl: true,
          ownerId: true,
        },
      });

    if (!expert) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      !canManageExpert(
        user,
        expert.ownerId,
      )
    ) {
      return Response.json(
        {
          code: "EXPERT_DELETE_FORBIDDEN",
        },
        { status: 403 },
      );
    }

    await prisma.expert.delete({
      where: {
        id: expertId,
      },
    });

    const imageFilePath =
      getLocalUploadPath(expert.imageUrl);

    if (imageFilePath) {
      await removeUploadedFile(
        imageFilePath,
        "EXPERT_IMAGE_DELETE_ERROR",
      );
    }

    return Response.json({
      code: "EXPERT_DELETED",
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        {
          code: "EXPERT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error("EXPERT_DELETE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "EXPERT_DELETE_FAILED",
      },
      { status: 500 },
    );
  }
}