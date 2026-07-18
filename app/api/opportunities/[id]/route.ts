import { randomUUID } from "crypto";
import {
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_TITLE_LENGTH = 200;
const MAX_COUNTRY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;

const OPPORTUNITY_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "opportunities",
);

const OPPORTUNITY_UPLOAD_URL_PREFIX =
  "/uploads/opportunities/";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_EXTENSION_MAP: Record<
  string,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function parseOpportunityId(id: string) {
  const opportunityId = Number(id);

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return null;
  }

  return opportunityId;
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
    !fileUrl.startsWith(
      OPPORTUNITY_UPLOAD_URL_PREFIX,
    )
  ) {
    return null;
  }

  const relativeFileName = fileUrl.slice(
    OPPORTUNITY_UPLOAD_URL_PREFIX.length,
  );

  const fileName = path.basename(
    relativeFileName,
  );

  if (
    !fileName ||
    fileName !== relativeFileName
  ) {
    return null;
  }

  const resolvedUploadDirectory =
    path.resolve(
      OPPORTUNITY_UPLOAD_DIRECTORY,
    );

  const resolvedFilePath = path.resolve(
    resolvedUploadDirectory,
    fileName,
  );

  if (
    !resolvedFilePath.startsWith(
      `${resolvedUploadDirectory}${path.sep}`,
    )
  ) {
    return null;
  }

  return resolvedFilePath;
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
    const opportunityId =
      parseOpportunityId(id);

    if (opportunityId === null) {
      return Response.json(
        {
          code: "INVALID_OPPORTUNITY_ID",
        },
        { status: 400 },
      );
    }

    const opportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
      });

    if (!opportunity) {
      return Response.json(
        {
          code: "OPPORTUNITY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return Response.json({
      code: "OPPORTUNITY_LOADED",
      opportunity,
    });
  } catch (error) {
    console.error(
      "OPPORTUNITY_GET_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "OPPORTUNITY_LOAD_FAILED",
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
    await requireAdmin();

    const { id } = await params;
    const opportunityId =
      parseOpportunityId(id);

    if (opportunityId === null) {
      return Response.json(
        {
          code: "INVALID_OPPORTUNITY_ID",
        },
        { status: 400 },
      );
    }

    const opportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          id: true,
          imageUrl: true,
        },
      });

    if (!opportunity) {
      return Response.json(
        {
          code: "OPPORTUNITY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    await prisma.opportunity.delete({
      where: {
        id: opportunityId,
      },
      select: {
        id: true,
      },
    });

    const imageFilePath =
      getLocalUploadPath(
        opportunity.imageUrl,
      );

    if (imageFilePath) {
      await removeUploadedFile(
        imageFilePath,
        "OPPORTUNITY_IMAGE_DELETE_ERROR",
      );
    }

    return Response.json({
      code: "OPPORTUNITY_DELETED",
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
          code: "OPPORTUNITY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error(
      "OPPORTUNITY_DELETE_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "OPPORTUNITY_DELETE_FAILED",
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
    await requireAdmin();

    const { id } = await params;
    const opportunityId =
      parseOpportunityId(id);

    if (opportunityId === null) {
      return Response.json(
        {
          code: "INVALID_OPPORTUNITY_ID",
        },
        { status: 400 },
      );
    }

    const currentOpportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          id: true,
          imageUrl: true,
        },
      });

    if (!currentOpportunity) {
      return Response.json(
        {
          code: "OPPORTUNITY_NOT_FOUND",
        },
        { status: 404 },
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

    const title = String(
      formData.get("title") ?? "",
    ).trim();

    const country = String(
      formData.get("country") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const imageValue = formData.get("image");

    if (!title || !country || !description) {
      return Response.json(
        {
          code: "OPPORTUNITY_REQUIRED_FIELDS_MISSING",
        },
        { status: 400 },
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return Response.json(
        {
          code: "OPPORTUNITY_TITLE_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      country.length > MAX_COUNTRY_LENGTH
    ) {
      return Response.json(
        {
          code: "OPPORTUNITY_COUNTRY_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return Response.json(
        {
          code: "OPPORTUNITY_DESCRIPTION_TOO_LONG",
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
          code: "INVALID_OPPORTUNITY_IMAGE",
        },
        { status: 400 },
      );
    }

    let imageUrl =
      currentOpportunity.imageUrl;

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
            code: "INVALID_OPPORTUNITY_IMAGE_TYPE",
          },
          { status: 400 },
        );
      }

      if (
        imageValue.size > MAX_FILE_SIZE
      ) {
        return Response.json(
          {
            code: "OPPORTUNITY_IMAGE_TOO_LARGE",
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
            code: "INVALID_OPPORTUNITY_IMAGE_TYPE",
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
            code: "INVALID_OPPORTUNITY_IMAGE_CONTENT",
          },
          { status: 400 },
        );
      }

      await mkdir(
        OPPORTUNITY_UPLOAD_DIRECTORY,
        {
          recursive: true,
        },
      );

      const fileName = `${randomUUID()}.${fileExtension}`;

      newUploadedFilePath = path.join(
        OPPORTUNITY_UPLOAD_DIRECTORY,
        fileName,
      );

      await writeFile(
        newUploadedFilePath,
        buffer,
        {
          flag: "wx",
        },
      );

      imageUrl = `${OPPORTUNITY_UPLOAD_URL_PREFIX}${fileName}`;
    }

    const opportunity =
      await prisma.opportunity.update({
        where: {
          id: opportunityId,
        },
        data: {
          title,
          country,
          description,
          imageUrl,
        },
        select: {
          id: true,
          title: true,
          country: true,
          status: true,
          description: true,
          imageUrl: true,
         
        },
      });

    const oldImageFilePath =
      newUploadedFilePath
        ? getLocalUploadPath(
            currentOpportunity.imageUrl,
          )
        : null;

    newUploadedFilePath = null;

    if (oldImageFilePath) {
      await removeUploadedFile(
        oldImageFilePath,
        "OPPORTUNITY_OLD_IMAGE_CLEANUP_ERROR",
      );
    }

    return Response.json({
      code: "OPPORTUNITY_UPDATED",
      opportunity,
    });
  } catch (error) {
    if (newUploadedFilePath) {
      await removeUploadedFile(
        newUploadedFilePath,
        "OPPORTUNITY_NEW_IMAGE_CLEANUP_ERROR",
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
          code: "OPPORTUNITY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error(
      "OPPORTUNITY_UPDATE_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "OPPORTUNITY_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}