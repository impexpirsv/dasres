import { requireAdmin } from "../../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return Response.json(
        { message: "Only image files are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "experts"
    );

    await mkdir(uploadDir, { recursive: true });

    const extension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return Response.json({
      url: `/uploads/experts/${fileName}`,
    });
  } catch (error) {
    console.error("UPLOAD_EXPERT_IMAGE_ERROR", error);

    return Response.json(
      { message: "Error uploading expert image." },
      { status: 500 }
    );
  }
}