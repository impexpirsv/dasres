import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunityId = Number(id);

    if (Number.isNaN(opportunityId)) {
      return Response.json(
        { message: "Invalid opportunity id" },
        { status: 400 }
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
        { message: "Opportunity not found" },
        { status: 404 }
      );
    }

    return Response.json(opportunity);
  } catch (error) {
    return Response.json(
      { message: "Error loading opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const opportunityId = Number(id);

    if (Number.isNaN(opportunityId)) {
      return Response.json(
        { message: "Invalid opportunity id" },
        { status: 400 }
      );
    }

    const opportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          imageUrl: true,
        },
      });

    if (!opportunity) {
      return Response.json(
        { message: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (opportunity.imageUrl) {
      const imagePath = path.join(
        process.cwd(),
        "public",
        opportunity.imageUrl
      );

      try {
        await fs.unlink(imagePath);
      } catch {
        // اگر عکس قبلاً حذف شده بود، حذف رکورد دیتابیس متوقف نشود
      }
    }

    await prisma.opportunity.delete({
      where: {
        id: opportunityId,
      },
    });

    return Response.json({
      message: "Opportunity deleted",
    });
  } catch (error) {
    return Response.json(
      { message: "Error deleting opportunity" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const opportunityId = Number(id);

    if (Number.isNaN(opportunityId)) {
      return Response.json(
        { message: "Invalid opportunity id" },
        { status: 400 }
      );
    }

    const currentOpportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          imageUrl: true,
        },
      });

    if (!currentOpportunity) {
      return Response.json(
        { message: "Opportunity not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const title = String(formData.get("title") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const description = String(
      formData.get("description") || ""
    ).trim();

    const image = formData.get("image") as File | null;

    if (!title || !country || !description) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    let imageUrl = currentOpportunity.imageUrl;

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

      if (currentOpportunity.imageUrl) {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          currentOpportunity.imageUrl
        );

        try {
          await fs.unlink(oldImagePath);
        } catch {
          // اگر عکس قبلی وجود نداشت، آپدیت متوقف نشود
        }
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "opportunities"
      );

      await fs.mkdir(uploadDir, { recursive: true });

      const fileExtension = extensionMap[image.type];

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;

      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/opportunities/${fileName}`;
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
      });

    return Response.json(opportunity);
  } catch (error) {
    return Response.json(
      { message: "Error updating opportunity" },
      { status: 500 }
    );
  }
}