import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// On some Windows/ISP setups Node picks up 127.0.0.1 as its only DNS server, which
// breaks the SRV lookup for mongodb+srv:// URIs. Fall back to public resolvers then.
function ensureUsableDns() {
  const servers = dns.getServers();
  if (servers.length && servers.every((s) => s === '127.0.0.1' || s === '::1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

let connecting = null;

// Safe to call on every request: on serverless hosts (Vercel) server.js never runs, so the
// app connects lazily and reuses the connection across warm invocations.
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!connecting) {
    mongoose.set('strictQuery', true);
    if (env.mongoUri.startsWith('mongodb+srv://')) ensureUsableDns();
    connecting = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err) => {
        connecting = null; // allow the next request to retry
        throw err;
      });
  }
  return connecting;
}
