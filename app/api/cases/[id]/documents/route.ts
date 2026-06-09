import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;
    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "cases"
    );

    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/cases/${fileName}`;

    await prisma.caseDocument.create({
      data: {
        caseId: Number(id),
        name: file.name,
        fileUrl,
      },
    });

    return Response.json({
      message: "Document uploaded",
    });
  } catch {
    return Response.json(
      { message: "Failed to upload document" },
      { status: 500 }
    );
  }
}