import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
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
    await requireAdmin();

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const specialty = String(
      formData.get("specialty") || ""
    ).trim();
    const experience = String(
      formData.get("experience") || ""
    ).trim();
    const email = String(formData.get("email") || "").trim();

    const image = formData.get("image") as File | null;

    if (
      !name ||
      !country ||
      !specialty ||
      !experience ||
      !email
    ) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (image && image.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        return Response.json(
          {
            message:
              "Invalid image type. Only JPG, PNG and WEBP are allowed.",
          },
          { status: 400 }
        );
      }

      if (image.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            message:
              "Image is too large. Maximum size is 5MB.",
          },
          { status: 400 }
        );
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "experts"
      );

      await mkdir(uploadDir, { recursive: true });

      const extensionMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const fileExtension = extensionMap[image.type];

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;

      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      imageUrl = `/uploads/experts/${fileName}`;
    }

    const expert = await prisma.expert.create({
      data: {
        name,
        country,
        specialty,
        status: "Verified Expert",
        experience,
        email,
        imageUrl,
      },
    });

    return Response.json(expert);
  } catch (error) {
    console.error("CREATE_EXPERT_ERROR", error);

    return Response.json(
      { message: "Error creating expert" },
      { status: 500 }
    );
  }
}