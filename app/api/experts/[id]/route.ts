import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function canManageExpert(user: { id: number; role: string }, ownerId: number | null) {
  return user.role === "admin" || ownerId === user.id;
}

function getLocalUploadPath(fileUrl: string | null) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/experts/")) {
    return null;
  }

  return path.join(process.cwd(), "public", fileUrl);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const expertId = Number(id);

    if (Number.isNaN(expertId)) {
      return Response.json({ message: "Invalid expert id" }, { status: 400 });
    }

    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
    });

    if (!expert) {
      return Response.json({ message: "Expert not found" }, { status: 404 });
    }

    return Response.json(expert);
  } catch {
    return Response.json({ message: "Error loading expert" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const expertId = Number(id);

    if (Number.isNaN(expertId)) {
      return Response.json({ message: "Invalid expert id" }, { status: 400 });
    }

    const currentExpert = await prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        imageUrl: true,
        ownerId: true,
      },
    });

    if (!currentExpert) {
      return Response.json({ message: "Expert not found" }, { status: 404 });
    }

    if (!canManageExpert(user, currentExpert.ownerId)) {
      return Response.json({ message: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const specialty = String(formData.get("specialty") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const email = String(formData.get("email") || "").trim();

    const image = formData.get("image") as File | null;

    if (!name || !country || !specialty || !experience || !email) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 },
      );
    }

    let imageUrl = currentExpert.imageUrl;

    if (image && image.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        return Response.json(
          { message: "Invalid image type. Only JPG, PNG and WEBP are allowed." },
          { status: 400 },
        );
      }

      if (image.size > MAX_FILE_SIZE) {
        return Response.json(
          { message: "Image is too large. Maximum size is 5MB." },
          { status: 400 },
        );
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "experts",
      );

      await mkdir(uploadDir, { recursive: true });

      const fileExtension = extensionMap[image.type];
      const fileName = `${expertId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;

      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      const oldFilePath = getLocalUploadPath(currentExpert.imageUrl);
      if (oldFilePath) {
        await unlink(oldFilePath).catch(() => {});
      }

      imageUrl = `/uploads/experts/${fileName}`;
    }

    const expert = await prisma.expert.update({
      where: { id: expertId },
      data: {
        name,
        country,
        specialty,
        experience,
        email,
        imageUrl,
      },
    });

    return Response.json(expert);
  } catch {
    return Response.json(
      { message: "Error updating expert" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const expertId = Number(id);

    if (Number.isNaN(expertId)) {
      return Response.json({ message: "Invalid expert id" }, { status: 400 });
    }

    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        imageUrl: true,
        ownerId: true,
      },
    });

    if (!expert) {
      return Response.json({ message: "Expert not found" }, { status: 404 });
    }

    if (!canManageExpert(user, expert.ownerId)) {
      return Response.json({ message: "Unauthorized" }, { status: 403 });
    }

    await prisma.expert.delete({
      where: { id: expertId },
    });

    const oldFilePath = getLocalUploadPath(expert.imageUrl);
    if (oldFilePath) {
      await unlink(oldFilePath).catch(() => {});
    }

    return Response.json({
      message: "Expert deleted",
    });
  } catch {
    return Response.json(
      { message: "Error deleting expert" },
      { status: 500 },
    );
  }
}