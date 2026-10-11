import mongoose from 'mongoose';
import sharp from 'sharp';
import { env } from '../config/env.js';
import Image from '../models/Image.js';
import Setting from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';

// Web app manifest + home-screen icons for the installable (PWA) store and admin apps.
// Icons are rendered from the store logo so the installed app matches the website.

const APPS = {
  store: { suffix: '', shortSuffix: '', description: 'Shop our collection.', theme: '#2a2420', background: '#fbf8f3' },
  admin: { suffix: ' Admin', shortSuffix: ' Admin', description: 'Manage products, orders, customers and site settings.', theme: '#1f1b17', background: '#f5f4f1' },
};
const ICON_SIZES = [180, 192, 512];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

// Used when there is no logo or it can't be read — the same diamond as the frontends' built-in icons.
const DEFAULT_LOGO = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 104 L384 256 L256 408 L128 256 Z" fill="#b8892f"/><path d="M256 104 L384 256 L256 256 Z" fill="#d4af5f"/><path d="M256 256 L128 256 L256 408 Z" fill="#8f6a1f"/></svg>',
);

const apiBase = (req) => `${req.get('x-forwarded-proto')?.split(',')[0] || req.protocol}://${req.get('host')}/api`;

/** GET /api/pwa/manifest.webmanifest?app=store|admin&origin=<frontend origin> */
export async function getManifest(req, res) {
  const appId = req.query.app === 'admin' ? 'admin' : 'store';
  const app = APPS[appId];
  // start_url must be on the frontend's origin, so the caller says which one; only known frontends are accepted.
  const origin = String(req.query.origin ?? '').replace(/\/+$/, '');
  if (!env.clientUrls.includes(origin)) throw ApiError.badRequest('Unknown origin.');

  const settings = await Setting.getSingleton();
  const name = `${settings.siteName}${app.suffix}`;
  const shortName = `${settings.siteName.split(/\s+/)[0]}${app.shortSuffix}`.slice(0, 20);

  let icons;
  if (settings.logo) {
    const v = settings.updatedAt?.getTime() ?? 0;
    const icon = (size, purpose) => ({
      src: `${apiBase(req)}/pwa/icon/${size}.png?app=${appId}&purpose=${purpose}&v=${v}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose,
    });
    icons = [icon(192, 'any'), icon(512, 'any'), icon(512, 'maskable')];
  } else {
    // No logo yet: the frontend's built-in icons.
    icons = [
      { src: `${origin}/pwa-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${origin}/pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${origin}/maskable-icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];
  }

  res.set({ 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' });
  res.send(
    JSON.stringify({
      id: '/',
      name,
      short_name: shortName,
      description: app.description,
      start_url: `${origin}/`,
      scope: `${origin}/`,
      display: 'standalone',
      theme_color: app.theme,
      background_color: app.background,
      icons,
    }),
  );
}

/** Reads the logo bytes: straight from MongoDB for our own uploads, otherwise over HTTP. */
async function loadLogo(url) {
  const ownUpload = url.match(/\/api\/uploads\/([a-f0-9]{24})(?:[?#]|$)/i);
  if (ownUpload && mongoose.isValidObjectId(ownUpload[1])) {
    const image = await Image.findById(ownUpload[1]);
    if (image) return image.data;
  }
  if (!/^https?:\/\//i.test(url)) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  return bytes.length <= MAX_LOGO_BYTES ? bytes : null;
}

/** Centres the logo on a square tile. Maskable icons keep it inside the 80% safe zone that launchers crop to. */
async function renderIcon(logo, size, padding, background) {
  const inner = Math.round(size * (1 - padding * 2));
  const fitted = await sharp(logo, { density: 300 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: 'centre' }])
    .png()
    .toBuffer();
}

// Rendered icons for this server instance, keyed by logo + size + purpose.
const iconCache = new Map();

/** GET /api/pwa/icon/:size.png?purpose=any|maskable — 180 is the iPhone home-screen icon. */
export async function getIcon(req, res) {
  const size = Number.parseInt(req.params.file, 10);
  if (!ICON_SIZES.includes(size) || !/^\d+\.png$/.test(req.params.file)) throw ApiError.notFound('Icon not found.');
  const maskable = req.query.purpose === 'maskable';

  const { logo: logoUrl } = await Setting.getSingleton();
  const key = `${logoUrl}|${size}|${maskable}`;
  let png = iconCache.get(key);
  if (!png) {
    // White tile so transparent and dark logos both read well; iOS doesn't allow transparent icons anyway.
    const background = { r: 255, g: 255, b: 255, alpha: 1 };
    const padding = maskable ? 0.2 : size === 180 ? 0.12 : 0.08;
    let logo = logoUrl ? await loadLogo(logoUrl).catch(() => null) : null;
    try {
      png = await renderIcon(logo ?? DEFAULT_LOGO, size, padding, background);
    } catch {
      logo = null; // unreadable image format
      png = await renderIcon(DEFAULT_LOGO, size, padding, background);
    }
    if (logo) {
      if (iconCache.size > 50) iconCache.clear();
      iconCache.set(key, png);
    }
  }

  // Versioned URLs (?v=settings time) never change; unversioned ones (the iPhone icon link) refresh hourly.
  res.set({
    'Content-Type': 'image/png',
    'Cache-Control': req.query.v ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
  res.send(png);
}
