import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

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

type ManageableUser = {
  id: number;
  role: string;
};

function canManageCompany(
  user: ManageableUser,
  ownerId: number | null,
) {
  return user.role === "admin" || ownerId === user.id;
}

function getCompanyId(id: string) {
  const companyId = Number(id);

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0
  ) {
    return null;
  }

  return companyId;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWebsite(value: string) {
  try {
    const parsedWebsite = new URL(value);

    return (
      parsedWebsite.protocol === "http:" ||
      parsedWebsite.protocol === "https:"
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

function getLocalUploadPath(fileUrl: string | null) {
  if (
    !fileUrl ||
    !fileUrl.startsWith("/uploads/companies/")
  ) {
    return null;
  }

  const relativePath = fileUrl.slice(1);

  if (
    relativePath.includes("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  const publicDirectory = path.join(
    process.cwd(),
    "public",
  );

  const resolvedFilePath = path.resolve(
    publicDirectory,
    relativePath,
  );

  const companiesUploadDirectory = path.resolve(
    publicDirectory,
    "uploads",
    "companies",
  );

  if (
    !resolvedFilePath.startsWith(
      `${companiesUploadDirectory}${path.sep}`,
    )
  ) {
    return null;
  }

  return resolvedFilePath;
}

async function removeFile(
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
    const companyId = getCompanyId(id);

    if (companyId === null) {
      return Response.json(
        {
          code: "INVALID_COMPANY_ID",
        },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
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
        verifiedAt: true,
        planType: true,
        ownerId: true,
        createdAt: true,
      },
    });

    if (!company) {
      return Response.json(
        {
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return Response.json({
      code: "COMPANY_LOADED",
      company,
    });
  } catch (error) {
    console.error("COMPANY_LOAD_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "COMPANY_LOAD_FAILED",
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
    const companyId = getCompanyId(id);

    if (companyId === null) {
      return Response.json(
        {
          code: "INVALID_COMPANY_ID",
        },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        logoUrl: true,
        ownerId: true,
      },
    });

    if (!company) {
      return Response.json(
        {
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (!canManageCompany(user, company.ownerId)) {
      return Response.json(
        {
          code: "COMPANY_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    await prisma.company.delete({
      where: {
        id: company.id,
      },
    });

    const oldLogoPath = getLocalUploadPath(
      company.logoUrl,
    );

    if (oldLogoPath) {
      await removeFile(
        oldLogoPath,
        "COMPANY_DELETE_LOGO_CLEANUP_ERROR",
      );
    }

    return Response.json({
      code: "COMPANY_DELETED",
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
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error("COMPANY_DELETE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "COMPANY_DELETE_FAILED",
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
  let savedLogoPath: string | null = null;

  try {
    const user = await requireUser();

    const { id } = await params;
    const companyId = getCompanyId(id);

    if (companyId === null) {
      return Response.json(
        {
          code: "INVALID_COMPANY_ID",
        },
        { status: 400 },
      );
    }

    const currentCompany =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
          logoUrl: true,
          ownerId: true,
        },
      });

    if (!currentCompany) {
      return Response.json(
        {
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      !canManageCompany(
        user,
        currentCompany.ownerId,
      )
    ) {
      return Response.json(
        {
          code: "COMPANY_ACCESS_DENIED",
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
          code: "COMPANY_REQUIRED_FIELDS_MISSING",
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

    let logoUrl = currentCompany.logoUrl;

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
      const buffer = Buffer.from(bytes);

      if (
        !matchesImageSignature(
          buffer,
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

      await writeFile(savedLogoPath, buffer, {
        flag: "wx",
      });

      logoUrl = `/uploads/companies/${fileName}`;
    }

    const company = await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        name,
        country,
        category,
        description,
        email,
        website,
        logoUrl,
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
        verifiedAt: true,
        planType: true,
        ownerId: true,
        createdAt: true,
        
      },
    });

    savedLogoPath = null;

    if (logoUrl !== currentCompany.logoUrl) {
      const oldLogoPath = getLocalUploadPath(
        currentCompany.logoUrl,
      );

      if (oldLogoPath) {
        await removeFile(
          oldLogoPath,
          "COMPANY_UPDATE_OLD_LOGO_CLEANUP_ERROR",
        );
      }
    }

    return Response.json({
      code: "COMPANY_UPDATED",
      company,
    });
  } catch (error) {
    if (savedLogoPath) {
      await removeFile(
        savedLogoPath,
        "COMPANY_UPDATE_NEW_LOGO_CLEANUP_ERROR",
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
          code: "COMPANY_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    console.error("COMPANY_UPDATE_ERROR", {
      error,
    });

    return Response.json(
      {
        code: "COMPANY_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}