import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_NAME_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 254;
const MAX_WEBSITE_LENGTH = 2048;

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

function isValidWebsite(value: string) {
  try {
    const parsedUrl = new URL(value);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
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

export async function POST(request: Request) {
  let savedLogoPath: string | null = null;

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

    const category = String(
      formData.get("category") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const website = String(
      formData.get("website") ?? "",
    ).trim();

    const logoValue = formData.get("logo");

    if (
      !name ||
      !country ||
      !category ||
      !description ||
      !email
    ) {
      return Response.json(
        {
          code: "REQUIRED_COMPANY_FIELDS_MISSING",
        },
        { status: 400 },
      );
    }

    if (
      name.length > MAX_NAME_LENGTH ||
      country.length > MAX_COUNTRY_LENGTH ||
      category.length > MAX_CATEGORY_LENGTH ||
      description.length > MAX_DESCRIPTION_LENGTH ||
      email.length > MAX_EMAIL_LENGTH ||
      website.length > MAX_WEBSITE_LENGTH
    ) {
      return Response.json(
        {
          code: "COMPANY_FIELD_TOO_LONG",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          code: "INVALID_COMPANY_EMAIL",
        },
        { status: 400 },
      );
    }

    if (website && !isValidWebsite(website)) {
      return Response.json(
        {
          code: "INVALID_COMPANY_WEBSITE",
        },
        { status: 400 },
      );
    }

    let logoUrl: string | null = null;

    if (
      logoValue !== null &&
      !(logoValue instanceof File)
    ) {
      return Response.json(
        {
          code: "INVALID_COMPANY_LOGO",
        },
        { status: 400 },
      );
    }

    if (
      logoValue instanceof File &&
      logoValue.size > 0
    ) {
      if (!ALLOWED_IMAGE_TYPES.has(logoValue.type)) {
        return Response.json(
          {
            code: "INVALID_COMPANY_LOGO_TYPE",
          },
          { status: 400 },
        );
      }

      if (logoValue.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            code: "COMPANY_LOGO_TOO_LARGE",
            maxSizeBytes: MAX_FILE_SIZE,
          },
          { status: 400 },
        );
      }

      const fileExtension =
        IMAGE_EXTENSION_MAP[logoValue.type];

      if (!fileExtension) {
        return Response.json(
          {
            code: "INVALID_COMPANY_LOGO_TYPE",
          },
          { status: 400 },
        );
      }

      const bytes = await logoValue.arrayBuffer();
      const fileBuffer = Buffer.from(bytes);

      if (
        !matchesImageSignature(
          fileBuffer,
          logoValue.type,
        )
      ) {
        return Response.json(
          {
            code: "INVALID_COMPANY_LOGO_CONTENT",
          },
          { status: 400 },
        );
      }

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "companies",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const fileName = `${randomUUID()}.${fileExtension}`;

      savedLogoPath = path.join(
        uploadDirectory,
        fileName,
      );

      await writeFile(savedLogoPath, fileBuffer, {
        flag: "wx",
      });

      logoUrl = `/uploads/companies/${fileName}`;
    }

    const company = await prisma.company.create({
      data: {
        name,
        country,
        category,
        status: "Active",
        description,
        email,
        website,
        logoUrl,
        ownerId: user.id,
      },
      select: {
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
      },
    });

    savedLogoPath = null;

    return Response.json(
      {
        code: "COMPANY_CREATED",
        company,
      },
      { status: 201 },
    );
  } catch (error) {
    if (savedLogoPath !== null) {
      try {
        await unlink(savedLogoPath);
      } catch (cleanupError) {
        console.error(
          "CREATE_COMPANY_LOGO_CLEANUP_ERROR",
          {
            path: savedLogoPath,
            error: cleanupError,
          },
        );
      }
    }

    if (error instanceof Response) {
      return error;
    }

    console.error("CREATE_COMPANY_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "COMPANY_CREATE_FAILED",
      },
      { status: 500 },
    );
  }
}