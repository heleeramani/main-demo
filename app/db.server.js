import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Prisma
// Used by ShopifySessionStorage
// ─────────────────────────────────────────────

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }

  prisma = global.__prisma;
}

export default prisma;

// ─────────────────────────────────────────────
// MongoDB / Mongoose
// Used by our application data
// ─────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from your .env file");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  cached.conn = await cached.promise;

  console.log("MongoDB connected:", mongoose.connection.host);

  return cached.conn;
}