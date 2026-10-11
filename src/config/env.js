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
  // Admin sessions are worth more to an attacker, so they expire sooner.
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h',
  cronSecret: process.env.CRON_SECRET || '',
  // Browsers send Origin without a trailing slash, so strip any from configured URLs.
  clientUrls: [...new Set([...defaultClientUrls, ...extraClientUrls].map((u) => u.trim().replace(/\/+$/, '')).filter(Boolean))],
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};

// Loud warnings for settings that make the API easy to break into.
if (env.jwtSecret.length < 32) {
  console.warn('SECURITY WARNING: JWT_SECRET is shorter than 32 characters; anyone who guesses it can forge admin logins. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
}
if (env.admin.password === 'Admin@123') {
  console.warn('SECURITY WARNING: ADMIN_PASSWORD is still the example value "Admin@123". Change the admin password.');
}
