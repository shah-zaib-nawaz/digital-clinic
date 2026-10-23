import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  try {
    const db = await connectDB();
    const readyState = db.connection.readyState;
    
    // Execute ping to measure live cluster latency
    if (db.connection.db) {
      await db.connection.db.admin().ping();
    }
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'ok',
        mongooseVersion: mongoose.version,
        readyState,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database connection error',
        readyState: mongoose.connection.readyState,
        latencyMs,
      },
      { status: 500 }
    );
  }
}
