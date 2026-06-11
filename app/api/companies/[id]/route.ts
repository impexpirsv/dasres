import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function canManageCompany(user: {
  id: number;
  role: string;
}, ownerId: number | null) {
  return user.role === "admin" || ownerId === user.id;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = Number(id);

    if (Number.isNaN(companyId)) {
      return Response.json(
        { message: "Invalid company id" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      return Response.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    return Response.json(company);
  } catch {
    return Response.json(
      { message: "Error loading company" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const companyId = Number(id);

    if (Number.isNaN(companyId)) {
      return Response.json(
        { message: "Invalid company id" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        logoUrl: true,
        ownerId: true,
      },
    });

    if (!company) {
      return Response.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    if (!canManageCompany(user, company.ownerId)) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    if (company.logoUrl) {
      const filePath = path.join(
        process.cwd(),
        "public",
        company.logoUrl
      );

      try {
        await fs.unlink(filePath);
      } catch {}
    }

    await prisma.company.delete({
      where: {
        id: companyId,
      },
    });

    return Response.json({
      message: "Company deleted",
    });
  } catch {
    return Response.json(
      { message: "Error deleting company" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const companyId = Number(id);

    if (Number.isNaN(companyId)) {
      return Response.json(
        { message: "Invalid company id" },
        { status: 400 }
      );
    }

    const currentCompany =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          logoUrl: true,
          ownerId: true,
        },
      });

    if (!currentCompany) {
      return Response.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    if (!canManageCompany(user, currentCompany.ownerId)) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const description = String(
      formData.get("description") || ""
    ).trim();
    const email = String(formData.get("email") || "").trim();
    const website = String(formData.get("website") || "").trim();

    const logo = formData.get("logo") as File | null;

    if (
      !name ||
      !country ||
      !category ||
      !description ||
      !email ||
    ) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    let logoUrl = currentCompany.logoUrl;

    if (logo && logo.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
        return Response.json(
          {
            message:
              "Invalid logo type. Only JPG, PNG and WEBP are allowed.",
          },
          { status: 400 }
        );
      }

      if (logo.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            message:
              "Logo is too large. Maximum size is 5MB.",
          },
          { status: 400 }
        );
      }

      if (currentCompany.logoUrl) {
        const oldLogoPath = path.join(
          process.cwd(),
          "public",
          currentCompany.logoUrl
        );

        try {
          await fs.unlink(oldLogoPath);
        } catch {}
      }

      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "companies"
      );

      await fs.mkdir(uploadDir, { recursive: true });

      const fileExtension = extensionMap[logo.type];

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;

      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);

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
    });

    return Response.json(company);
  } catch {
    return Response.json(
      { message: "Error updating company" },
      { status: 500 }
    );
  }
}