import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// ─── Upload constraints ────────────────────────────────────────────────────────
// UPLOAD_MAX_FILE_SIZE is enforced client-side only (UX guard).
// Cloudinary does NOT include max_file_size in the signed parameter set,
// so it cannot be enforced via signature. For server-side enforcement,
// configure max_file_size in your Cloudinary upload preset instead.

export const UPLOAD_FOLDER = "travel-checks";
export const UPLOAD_ALLOWED_FORMATS = "jpg,jpeg,png,webp";
export const UPLOAD_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — client-side limit

// ─── Signature generator ───────────────────────────────────────────────────────

export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);

  // Only signable params: folder, allowed_formats, timestamp.
  // max_file_size is intentionally excluded — Cloudinary omits it from
  // its own signature computation, so including it causes a mismatch.
  const paramsToSign = {
    folder: UPLOAD_FOLDER,
    allowed_formats: UPLOAD_ALLOWED_FORMATS,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    folder: UPLOAD_FOLDER,
    allowedFormats: UPLOAD_ALLOWED_FORMATS,
    maxFileSize: UPLOAD_MAX_FILE_SIZE, // returned for client-side validation only
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}
