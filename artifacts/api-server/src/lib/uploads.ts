import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

// esbuild bundles every local module into a single artifacts/api-server/dist/index.mjs,
// so import.meta.url here reflects that bundled file's location, not this
// source file's — one level up from dist/, not two from src/lib/.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_FILES_PER_REQUEST = 6;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

export const uploadImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function uploadedFileUrls(files: Express.Multer.File[] | undefined): string[] {
  return (files ?? []).map((file) => `/uploads/${file.filename}`);
}

export function deleteUploadedFiles(files: Express.Multer.File[] | undefined): void {
  for (const file of files ?? []) {
    fs.unlink(file.path, () => {
      // Best-effort cleanup — nothing to do if it's already gone.
    });
  }
}
