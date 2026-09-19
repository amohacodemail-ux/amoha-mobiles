import { Response } from 'express';

/**
 * In-memory Server-Sent Events hub for Live Location Tracking.
 *
 * Salespersons upsert their latest live location through the REST API; the
 * route publishes the transformed record here so every connected Admin
 * browser gets pushed the update instantly (no manual refresh, no polling).
 *
 * This reuses the existing Express backend + the app's own JWT auth. Browser
 * `EventSource` cannot send an Authorization header, so the Admin app connects
 * same-origin (proxied by Next.js rewrites, which forwards the `admin_token`
 * cookie) and the stream endpoint authenticates from the cookie/query token.
 *
 * Cardiac events are handled by the route; this module only tracks clients.
 */
const clients = new Set<Response>();

let heartbeatTimer: NodeJS.Timeout | null = null;

function ensureHeartbeat(): void {
  if (heartbeatTimer) return;
  // Keep proxies from closing idle streams + let clients detect dead servers.
  heartbeatTimer = setInterval(() => {
    for (const res of clients) {
      try {
        res.write(': ping\n\n');
      } catch {
        /* connection already closed */
      }
    }
  }, 20000);
  // Don't let an unref'd nothing keep the process alive on tests.
  heartbeatTimer.unref?.();
}

export function getLiveStreamClientCount(): number {
  return clients.size;
}

export function addLiveStreamClient(res: Response): void {
  clients.add(res);
  ensureHeartbeat();
}

export function removeLiveStreamClient(res: Response): void {
  clients.delete(res);
  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/** Push a location/status update record to every connected Admin client. */
export function broadcastLiveLocation(payload: Record<string, unknown>): void {
  if (clients.size === 0) return;
  const frame = `data: ${JSON.stringify({ type: 'live', data: payload })}\n\n`;
  for (const res of clients) {
    try {
      res.write(frame);
    } catch {
      clients.delete(res);
    }
  }
}