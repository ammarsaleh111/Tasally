/**
 * Real-Time Data Manager
 * Provides WebSocket-like real-time updates using Server-Sent Events (SSE)
 * More browser-compatible than WebSockets for one-way server-to-client data
 * 
 * Features:
 * - Live player tracking
 * - Game telemetry
 * - Heartbeat system
 * - Automatic reconnection
 * - Cross-browser compatible (works on Firefox, Safari, Chrome)
 */

// Global state for real-time data
let eventSource = null;
let listeners = new Map();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 1000;

/**
 * Subscribe to real-time updates
 * @param {string} channel - Channel name (e.g., 'players', 'games', 'metrics')
 * @param {Function} callback - Called when data arrives
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRealtime(channel, callback) {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set());
  }
  listeners.get(channel).add(callback);
  
  // Start connection if not already connected
  if (!eventSource) {
    connectToSSE();
  }
  
  return () => {
    const channelListeners = listeners.get(channel);
    if (channelListeners) {
      channelListeners.delete(callback);
      if (channelListeners.size === 0) {
        listeners.delete(channel);
      }
    }
    
    // Disconnect if no more listeners
    if (listeners.size === 0 && eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Connect to Server-Sent Events endpoint
 */
function connectToSSE() {
  if (typeof window === 'undefined') return;
  
  try {
    eventSource = new EventSource('/api/realtime/stream');
    
    eventSource.onopen = () => {
      console.log('[Realtime] Connected to SSE');
      reconnectAttempts = 0;
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { channel, payload, timestamp } = data;
        
        // Notify listeners for this channel
        const channelListeners = listeners.get(channel);
        if (channelListeners) {
          channelListeners.forEach(callback => {
            try {
              callback(payload, timestamp);
            } catch (e) {
              console.error('[Realtime] Listener error:', e);
            }
          });
        }
        
        // Also notify 'all' listeners
        const allListeners = listeners.get('all');
        if (allListeners) {
          allListeners.forEach(callback => {
            try {
              callback({ channel, payload, timestamp });
            } catch (e) {
              console.error('[Realtime] All listener error:', e);
            }
          });
        }
      } catch (e) {
        console.error('[Realtime] Parse error:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.warn('[Realtime] SSE error, attempting reconnect...', error);
      eventSource?.close();
      eventSource = null;
      
      // Exponential backoff reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts);
        reconnectAttempts++;
        setTimeout(connectToSSE, delay);
      } else {
        console.error('[Realtime] Max reconnect attempts reached');
        // Fall back to polling
        startPollingFallback();
      }
    };
  } catch (e) {
    console.error('[Realtime] Failed to create EventSource:', e);
    startPollingFallback();
  }
}

/**
 * Fallback polling mechanism for browsers without SSE support
 */
let pollingInterval = null;
function startPollingFallback() {
  if (pollingInterval) return;
  
  console.log('[Realtime] Starting polling fallback');
  
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/realtime/poll');
      const data = await response.json();
      
      // Distribute data to listeners
      Object.entries(data).forEach(([channel, payload]) => {
        const channelListeners = listeners.get(channel);
        if (channelListeners) {
          channelListeners.forEach(callback => callback(payload, Date.now()));
        }
      });
    } catch (e) {
      console.error('[Realtime] Polling error:', e);
    }
  }, 2000); // Poll every 2 seconds
}

/**
 * Stop all real-time connections
 */
export function disconnectRealtime() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  listeners.clear();
}

/**
 * Send a heartbeat/activity update to the server
 * @param {Object} data - Activity data
 */
export async function sendHeartbeat(data) {
  if (typeof window === 'undefined') return;
  
  try {
    await fetch('/api/realtime/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
    });
  } catch (e) {
    console.warn('[Realtime] Heartbeat failed:', e);
  }
}

/**
 * Send game telemetry data
 * @param {string} game - Game name
 * @param {string} eventType - Event type (start, progress, hint, end)
 * @param {Object} details - Event details
 */
export async function sendGameTelemetry(game, eventType, details = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    await fetch('/api/realtime/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game,
        eventType,
        details,
        timestamp: Date.now(),
      }),
    });
  } catch (e) {
    console.warn('[Realtime] Telemetry failed:', e);
  }
}

/**
 * Get current real-time connection status
 */
export function getRealtimeStatus() {
  return {
    connected: eventSource?.readyState === EventSource.OPEN,
    polling: !!pollingInterval,
    reconnectAttempts,
    listenerCount: Array.from(listeners.values()).reduce((sum, set) => sum + set.size, 0),
  };
}
