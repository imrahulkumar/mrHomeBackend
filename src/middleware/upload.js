import path from 'node:path';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Legacy folder for images uploaded before storage moved to MongoDB; still served read-only.
export const UPLOAD_DIR = path.resolve('uploads');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Keep the file in memory; the controller saves it to MongoDB (Vercel's filesystem is read-only).
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // Vercel rejects request bodies over ~4.5MB
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only JPG, PNG, WEBP, GIF or SVG images are allowed.')),
});
