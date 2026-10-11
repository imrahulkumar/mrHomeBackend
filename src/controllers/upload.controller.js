import mongoose from 'mongoose';
import sharp from 'sharp';
import Image from '../models/Image.js';
import { ApiError } from '../utils/ApiError.js';

// What the bytes actually are (per sharp), mapped to the Content-Type we serve them with.
const FORMATS = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

/** POST /api/uploads (admin, multipart field "image") → { url } */
export async function uploadImage(req, res) {
  if (!req.file) throw ApiError.badRequest('No image received.');
  // Don't trust the browser-supplied MIME type: decode the file and keep it only if it really is an image.
  const { format } = await sharp(req.file.buffer).metadata().catch(() => ({}));
  const contentType = FORMATS[format];
  if (!contentType) throw ApiError.badRequest('That file is not a valid JPG, PNG, WEBP, GIF or SVG image.');

  const image = await Image.create({
    data: req.file.buffer,
    contentType,
    size: req.file.size,
    originalName: String(req.file.originalname ?? '').slice(0, 200),
  });
  // Build from the request so the URL is right on any host, without relying on PUBLIC_URL.
  const proto = req.get('x-forwarded-proto')?.split(',')[0] || req.protocol;
  res.status(201).json({ url: `${proto}://${req.get('host')}/api/uploads/${image._id}` });
}

/** GET /api/uploads/:id (public) → image bytes */
export async function getImage(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Image not found.');
  const image = await Image.findById(req.params.id);
  if (!image) throw ApiError.notFound('Image not found.');
  res.set({
    'Content-Type': image.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    // SVGs can carry scripts; never let them run as a page on the API origin.
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  });
  res.send(image.data);
}
