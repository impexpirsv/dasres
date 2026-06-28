import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function getCloudinaryPublicId(url: string) {
  if (!url.includes("res.cloudinary.com")) {
    return null;
  }

  const uploadIndex = url.indexOf("/upload/");

  if (uploadIndex === -1) {
    return null;
  }

  const afterUpload = url.slice(uploadIndex + "/upload/".length);

  const withoutVersion = afterUpload.replace(/^v\d+\//, "");

  const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");

  return withoutExtension;
}

export { cloudinary };