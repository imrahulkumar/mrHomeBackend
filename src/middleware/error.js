import mongoose from 'mongoose';
import multer from 'multer';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue ?? {}).join(', ') || 'Value'} already exists.`;
  } else if (err instanceof multer.MulterError) {
    status = 400;
  } else if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    status = err.status; // malformed / oversized JSON body
    message = err.type === 'entity.too.large' ? 'Request is too large.' : 'Invalid JSON body.';
  }

  const isDev = env.nodeEnv === 'development';
  if (status >= 500) {
    console.error(err);
    if (!isDev) message = 'Something went wrong. Please try again.'; // never leak internals in production
  }
  res.status(status).json({ message, ...(isDev && status >= 500 && { stack: err.stack }) });
}
