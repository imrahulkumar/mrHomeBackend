import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter, sanitizeBody } from './middleware/security.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import routes from './routes/index.js';

const app = express();

// Behind Vercel's (or any host's) proxy: take the client IP from X-Forwarded-For so rate limits are per visitor.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // allow frontends to load /uploads images
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBody);
if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Legacy files may include SVGs; sandbox them so they can never run script on the API origin.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    maxAge: '7d',
    setHeaders: (res) => res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox"),
  }),
);
app.use('/api', apiLimiter);
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});
app.use('/api', attachUser, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
