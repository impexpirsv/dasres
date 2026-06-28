import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { cloudinary } from "../../../lib/cloudinary";

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

const base64 = `data:${image.type};base64,${buffer.toString(
  "base64"
)}`;

const result = await cloudinary.uploader.upload(base64, {
  folder: "dasres/experts",
  resource_type: "image",
});

imageUrl = result.secure_url;
    }

    const expert = await prisma.expert.create({
      data: {
        name,
        country,
        specialty,
        status: "Active",
        experience,
        email,
        imageUrl,
        ownerId: user.id,
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