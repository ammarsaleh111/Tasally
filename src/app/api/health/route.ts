/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Provides system health status for monitoring:
 * - Database connectivity
 * - Response latency
 * - Version info
 * 
 * Use this for:
 * - Uptime monitoring (e.g., Netlify, UptimeRobot)
 * - Load balancer health checks
 * - Debugging connectivity issues
 */

import { NextResponse } from "next/server";
import { checkDbConnection } from "@/db";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      latencyMs: number;
      message?: string;
    };
  };
}

// Track process start time for uptime
const startTime = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // Check database connectivity
  const dbCheck = await checkDbConnection();
  
  const status: HealthStatus = {
    status: dbCheck.ok ? 'healthy' : 'unhealthy',
    timestamp,
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks: {
      database: {
        status: dbCheck.ok ? 'ok' : 'error',
        latencyMs: dbCheck.latencyMs,
        message: dbCheck.ok ? undefined : 'Database connection failed',
      },
    },
  };

  const httpStatus = dbCheck.ok ? 200 : 503;

  const response = NextResponse.json(status, { status: httpStatus });
  
  // No caching for health endpoint
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  return response;
}
