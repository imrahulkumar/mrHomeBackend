import mongoose from 'mongoose';

export const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Builds a slug that is unique within `scope` (e.g. { category: id }), appending -2, -3… if needed. */
export async function uniqueSlug(Model, text, { excludeId, scope = {} } = {}) {
  const base = slugify(text) || 'item';
  let slug = base;
  for (let n = 2; await Model.exists({ ...scope, slug, ...(excludeId && { _id: { $ne: excludeId } }) }); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Copies only the listed keys that are present (not undefined) on `source`. */
export const pick = (source, keys) =>
  Object.fromEntries(keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (value) => mongoose.isValidObjectId(value) && String(new mongoose.Types.ObjectId(value)) === value;

export const toList = (value) =>
  (Array.isArray(value) ? value : String(value ?? '').split(',')).map((v) => v.trim()).filter(Boolean);

export const isAdminRequest = (req) => req.user?.role === 'admin';

/** Extracts the 11-char video id from any common YouTube URL format (watch, youtu.be, embed, shorts). */
export function extractYouTubeId(url = '') {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
