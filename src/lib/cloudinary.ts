import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

/**
 * Validate an uploaded file.
 */
export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format non supporté. Utilisez JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_SIZE) {
    return "Fichier trop volumineux. Maximum 10 Mo.";
  }
  return null;
}

/**
 * Upload an image buffer to Cloudinary.
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        }
      )
      .end(buffer);
  });
}
