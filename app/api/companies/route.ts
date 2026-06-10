import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  try {
    const user = await requireUser();

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
      !website
    ) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    let logoUrl: string | null = null;

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

      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "companies"
      );

      await mkdir(uploadDir, { recursive: true });

      const extensionMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const fileExtension = extensionMap[logo.type];

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;

      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      logoUrl = `/uploads/companies/${fileName}`;
    }

    const company = await prisma.company.create({
      data: {
        name,
        country,
        category,
        status: "Verified Company",
        description,
        email,
        website,
        logoUrl,
        ownerId: user.id,
      },
    });

    return Response.json(company);
  } catch (error) {
    console.error("CREATE_COMPANY_ERROR", error);

    return Response.json(
      { message: "Error creating company" },
      { status: 500 }
    );
  }
}