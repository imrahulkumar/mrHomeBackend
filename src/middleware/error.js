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
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message, ...(env.nodeEnv === 'development' && status >= 500 && { stack: err.stack }) });
}
