'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { liveLocationService, type LiveLocation } from '@/services/sales.service';

export type LiveStreamMode = 'connecting' | 'sse' | 'polling';

const POLL_MS = 3000;
const SSE_STALL_MS = 20000;
const SSE_RECONNECT_MS = 30000;

function getAdminToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('admin_token='))
      ?.split('=')[1] || ''
  );
}

/**
 * Live Admin view over every salesperson's latest live location.
 *
 * Real-time updates stream over a Server-Sent Events connection
 * (GET /api/sales/live-locations/stream). Because the stream requires an
 * authenticated admin token, this uses a plain fetch + streaming reader so we
 * can send the `Authorization` header. If the stream errors, closes, or goes
 * silent for `SSE_STALL_MS`, we automatically fall back to 3s polling and
 * periodically try to restore the SSE connection.
 */
export function useLiveLocations() {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [mode, setMode] = useState<LiveStreamMode>('connecting');
  const [error, setError] = useState<string>('');
  const [connected, setConnected] = useState(false);

  const rowsRef = useRef<Map<string, LiveLocation>>(new Map());
  const controllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSseAtRef = useRef(0);
  const destroyedRef = useRef(false);

  const apply = useCallback((list: LiveLocation[]) => {
    if (!Array.isArray(list)) return;
    let changed = false;
    for (const item of list) {
      if (!item?.salespersonId) continue;
      rowsRef.current.set(item.salespersonId, item);
      changed = true;
    }
    if (changed) setLocations(Array.from(rowsRef.current.values()));
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const list = await liveLocationService.getAll();
      apply(list);
      setError('');
      return true;
    } catch {
      setError('Live feed is temporarily unavailable');
      return false;
    }
  }, [apply]);

  const startPolling = useCallback(() => {
    setMode('polling');
    setConnected(false);
    if (!pollTimerRef.current) {
      void fetchSnapshot();
      pollTimerRef.current = setInterval(() => void fetchSnapshot(), POLL_MS);
    }
  }, [fetchSnapshot]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const connectSSE = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (destroyedRef.current) return;
    setMode('connecting');

    try {
      const token = getAdminToken();
      const res = await fetch('/api/sales/live-locations/stream', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`SSE request failed (${res.status})`);

      stopPolling();
      setError('');
      setConnected(true);
      setMode('sse');
      lastSseAtRef.current = Date.now();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut: number;
        while ((cut = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          // Skip :comment / :keepalive heartbeat lines.
          const dataLine = raw.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const record = JSON.parse(dataLine.slice(5).trim()) as LiveLocation;
            apply([record]);
            lastSseAtRef.current = Date.now();
          } catch {
            /* ignore malformed event */
          }
        }
      }
    } catch {
      /* aborted or failed — handled below */
    } finally {
      controllerRef.current = null;
      if (!destroyedRef.current) startPolling();
    }
  }, [apply, startPolling, stopPolling]);

  useEffect(() => {
    void fetchSnapshot();
    void connectSSE();

    // Stall guard: if the SSE connection stays open but goes silent, fall back
    // to polling (the reconnect timer below will restore SSE later).
    const stallTimer = setInterval(() => {
      if (controllerRef.current && Date.now() - lastSseAtRef.current > SSE_STALL_MS) {
        controllerRef.current.abort();
        controllerRef.current = null;
        startPolling();
      }
    }, SSE_STALL_MS);

    // While in polling mode, periodically try to restore the live stream.
    reconnectTimerRef.current = setInterval(() => {
      if (!controllerRef.current) void connectSSE();
    }, SSE_RECONNECT_MS);

    return () => {
      destroyedRef.current = true;
      controllerRef.current?.abort();
      controllerRef.current = null;
      clearInterval(stallTimer);
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { locations, mode, error, connected, refresh: fetchSnapshot };
}