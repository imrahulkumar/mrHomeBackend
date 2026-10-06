import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;

// Frontends that may always call the API; CLIENT_URLS adds to this list.
const defaultClientUrls = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mr-home-admin-front-end.vercel.app',
  'https://mr-home-user-front-end.vercel.app',
];
const extraClientUrls = (process.env.CLIENT_URLS || '').split(',');

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Browsers send Origin without a trailing slash, so strip any from configured URLs.
  clientUrls: [...new Set([...defaultClientUrls, ...extraClientUrls].map((u) => u.trim().replace(/\/+$/, '')).filter(Boolean))],
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
