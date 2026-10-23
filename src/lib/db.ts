import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

import * as dotenv from 'dotenv';

if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env.local' });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  clientPromise: Promise<MongoClient> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongooseCache || {
  conn: null,
  promise: null,
  clientPromise: null,
};

if (!globalThis._mongooseCache) {
  globalThis._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: any = {
      bufferCommands: false,
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxAdaptiveRetries: 2,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function getMongoClient(): Promise<MongoClient> {
  const mongooseInstance = await connectDB();
  return mongooseInstance.connection.getClient() as MongoClient;
}
