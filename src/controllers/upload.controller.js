import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** POST /api/uploads (admin, multipart field "image") → { url } */
export function uploadImage(req, res) {
  if (!req.file) throw ApiError.badRequest('No image received.');
  res.status(201).json({ url: `${env.publicUrl}/uploads/${req.file.filename}` });
}
