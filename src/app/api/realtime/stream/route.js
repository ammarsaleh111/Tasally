/**
 * Real-Time SSE Stream API Route
 * Server-Sent Events endpoint for live admin dashboard updates
 * 
 * Performance optimizations for serverless:
 * - Connection timeout (2 minutes) to prevent serverless hanging
 * - Max connections per IP limit
 * - Keepalive pings every 30 seconds
 * - Graceful cleanup on disconnect
 */

import { activeClients, activeSessions, gameStates, connectionsByIP, metrics, broadcast, updateSession, updateGameState, broadcastMetrics } from '../store';

// Serverless-friendly limits
const MAX_CONNECTION_TIME_MS = 2 * 60 * 1000; // 2 minutes max connection
const MAX_CONNECTIONS_PER_IP = 3;
const KEEPALIVE_INTERVAL_MS = 30000;

export async function GET(request) {
  metrics.totalConnections++;
  
  // Get client IP for connection limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // Check connection limit per IP
  const currentConnections = connectionsByIP.get(clientIP) || 0;
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    return new Response(
      JSON.stringify({ error: 'Too many connections from this IP' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Track this connection
  connectionsByIP.set(clientIP, currentConnections + 1);
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  // Custom controller to track this client
  const controller = {
    enqueue: (data) => writer.write(encoder.encode(data)),
    clientIP,
    connectedAt: Date.now(),
  };
  
  activeClients.add(controller);
  
  // Send initial connection message
  const initialData = JSON.stringify({
    channel: 'connection',
    payload: { 
      status: 'connected', 
      clientCount: activeClients.size,
      maxConnectionTime: MAX_CONNECTION_TIME_MS / 1000,
    },
    timestamp: Date.now(),
  });
  writer.write(encoder.encode(`data: ${initialData}\n\n`));
  
  // Send current metrics immediately
  setTimeout(() => broadcastMetrics(), 100);
  
  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    try {
      writer.write(encoder.encode(`: keepalive\n\n`));
    } catch (e) {
      clearInterval(keepAlive);
      cleanupConnection(controller);
    }
  }, KEEPALIVE_INTERVAL_MS);
  
  // Connection timeout - force close after MAX_CONNECTION_TIME
  const connectionTimeout = setTimeout(() => {
    try {
      const timeoutMsg = JSON.stringify({
        channel: 'connection',
        payload: { status: 'timeout', reason: 'Connection timeout - please reconnect' },
        timestamp: Date.now(),
      });
      writer.write(encoder.encode(`data: ${timeoutMsg}\n\n`));
      writer.close().catch(() => {});
    } catch (e) {
      // Ignore errors during cleanup
    }
    cleanupConnection(controller);
    clearInterval(keepAlive);
  }, MAX_CONNECTION_TIME_MS);
  
  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    clearTimeout(connectionTimeout);
    cleanupConnection(controller);
    writer.close().catch(() => {});
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx support
    },
  });
}

/**
 * Clean up a disconnected client
 */
function cleanupConnection(controller) {
  activeClients.delete(controller);
  
  // Decrement IP connection count
  const currentCount = connectionsByIP.get(controller.clientIP) || 1;
  if (currentCount <= 1) {
    connectionsByIP.delete(controller.clientIP);
  } else {
    connectionsByIP.set(controller.clientIP, currentCount - 1);
  }
}
