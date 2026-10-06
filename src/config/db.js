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

export async function connectDB() {
  mongoose.set('strictQuery', true);
  if (env.mongoUri.startsWith('mongodb+srv://')) ensureUsableDns();
  const conn = await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}
