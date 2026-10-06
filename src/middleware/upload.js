import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const UPLOAD_DIR = path.resolve('uploads');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only JPG, PNG, WEBP, GIF or SVG images are allowed.')),
});
