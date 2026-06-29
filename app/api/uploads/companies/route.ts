import { requireAdmin } from "../../../../lib/auth";
import { cloudinary } from "../../../../lib/cloudinary";

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
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return Response.json(
        { message: "Only image files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { message: "File is too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "dasres/companies",
      resource_type: "image",
    });

    return Response.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("UPLOAD_COMPANY_LOGO_ERROR", error);

    return Response.json(
      { message: "Error uploading company logo." },
      { status: 500 }
    );
  }
}