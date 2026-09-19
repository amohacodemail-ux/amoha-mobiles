/**
 * Live Tracking — browser singleton
 * AMOHA Mobiles Admin Panel
 *
 * A single `navigator.geolocation.watchPosition()` watcher is shared across the
 * whole SPA (module-level state survives Next.js client-side navigation), so
 * tracking continues while the salesperson navigates between pages.
 *
 * IMPORTANT BROWSER LIMITATION:
 * watchPosition() only provides reliable tracking while the salesperson page /
 * tab stays active in the foreground. It is NOT guaranteed background tracking
 * when the browser/app is closed or the OS suspends the page. True background
 * tracking would require a PWA / native / background-location architecture.
 * This module implements robust FOREGROUND live tracking only.
 *
 * The backend upserts a single `live_locations` row per salesperson, so GPS
 * ticks are throttled/deduped client-side to avoid needless network + DB load.
 */
import { liveLocationService, type TrackingStatus, type GeoFence } from './sales.service';

export interface LiveTrackingFix {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: string;
}

export interface LiveTrackingSnapshot {
  status: TrackingStatus;
  coords: LiveTrackingFix | null;
  accuracy: number | null;
  geofenceStatus: 'inside' | 'outside' | null;
  distanceFromGeofence: number | null;
  fenceId: string | null;
  fenceName: string;
  errorMessage: string;
  updatedAt: string | null;
  fixAt: number | null;
  supported: boolean;
}

const STORAGE_KEY = 'amoha_live_tracking';
const MIN_SEND_INTERVAL_MS = 3000;
const MIN_MOVE_METERS = 3;

type Listener = (snapshot: LiveTrackingSnapshot) => void;

interface PersistedState {
  status: TrackingStatus;
  coords: LiveTrackingFix | null;
  fenceId: string | null;
  fenceName: string;
  updatedAt: string | null;
  fixAt: number | null;
}

let watchId: number | null = null;
let status: TrackingStatus = 'not_tracking';
let coords: LiveTrackingFix | null = null;
let geofenceStatus: 'inside' | 'outside' | null = null;
let distanceFromGeofence: number | null = null;
let fenceId: string | null = null;
let fenceName = '';
let errorMessage = '';
let updatedAt: string | null = null;
let fixAt: number | null = null;

let fenceCenterLat = 0;
let fenceCenterLng = 0;
let fenceRadiusMeters = 0;

let lastSentLat = 0;
let lastSentLng = 0;
let lastSentAt = 0;

const listeners = new Set<Listener>();

/** Haversine distance in meters (mirrors the backend formula). */
function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(la2 - la1);
  const dLng = r(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function persist(): void {
  try {
    const state: PersistedState = { status, coords, fenceId, fenceName, updatedAt, fixAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — ignore */
  }
}

function snapshot(): LiveTrackingSnapshot {
  return {
    status,
    coords,
    accuracy: coords?.accuracy ?? null,
    geofenceStatus,
    distanceFromGeofence,
    fenceId,
    fenceName,
    errorMessage,
    updatedAt,
    fixAt,
    supported: typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined',
  };
}

function notify(): void {
  const snap = snapshot();
  for (const fn of listeners) fn(snap);
}

/** Send the current fix to the backend (best-effort — tracking must not die on network errors). */
async function pushToBackend(nextStatus?: TrackingStatus): Promise<void> {
  try {
    const payload: Parameters<typeof liveLocationService.update>[0] = {
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      accuracyMeters: coords?.accuracy ?? null,
      trackingStatus: nextStatus ?? status,
      timestamp: coords?.timestamp ?? new Date().toISOString(),
      fenceId,
    };
    const record = await liveLocationService.update(payload);
    if (record.updatedAt) updatedAt = record.updatedAt;
    // Server is authoritative for fence status/distance.
    if (coords) {
      geofenceStatus = record.geofenceStatus ?? geofenceStatus;
      distanceFromGeofence =
        record.distanceFromGeofence !== null && record.distanceFromGeofence !== undefined
          ? Number(record.distanceFromGeofence)
          : distanceFromGeofence;
    }
    lastSentAt = Date.now();
    lastSentLat = coords?.lat ?? 0;
    lastSentLng = coords?.lng ?? 0;
  } catch {
    /* best-effort: keep local tracking state, a later tick will retry */
  } finally {
    notify();
  }
}

function evaluateFence(): void {
  if (!coords || !fenceRadiusMeters) {
    geofenceStatus = null;
    distanceFromGeofence = null;
    return;
  }
  distanceFromGeofence = Math.round(
    haversine(coords.lat, coords.lng, fenceCenterLat, fenceCenterLng),
  );
  geofenceStatus = distanceFromGeofence <= fenceRadiusMeters ? 'inside' : 'outside';
}

function handlePosition(pos: GeolocationPosition): void {
  const lat = Number(pos.coords.latitude.toFixed(7));
  const lng = Number(pos.coords.longitude.toFixed(7));
  const accuracy = isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
  const timestamp = new Date(pos.timestamp).toISOString();

  const sameSpot = coords !== null && Math.abs(lat - coords.lat) < 1e-6 && Math.abs(lng - coords.lng) < 1e-6;
  coords = { lat, lng, accuracy, timestamp };
  evaluateFence();
  updatedAt = timestamp;
  fixAt = Date.now();
  status = 'tracking_active';
  errorMessage = '';
  persist();

  const movedEnough = coords
    ? !sameSpot && haversine(lat, lng, lastSentLat || lat, lastSentLng || lng) >= MIN_MOVE_METERS
    : false;
  const throttleElapsed = Date.now() - lastSentAt >= MIN_SEND_INTERVAL_MS;

  if (!sameSpot && (movedEnough || throttleElapsed)) {
    void pushToBackend();
  } else {
    notify();
  }
}

function handlePositionError(err: GeolocationPositionError): void {
  const isWatch = watchId !== null;
  switch (err.code) {
    case err.PERMISSION_DENIED:
      status = 'location_permission_denied';
      errorMessage = 'Location permission was denied. Enable location access for this site in your browser settings and try again.';
      break;
    case err.POSITION_UNAVAILABLE:
      status = 'location_unavailable';
      errorMessage = 'Location is unavailable right now. Make sure GPS/Wi-Fi is enabled and try again.';
      break;
    case err.TIMEOUT:
      status = 'location_unavailable';
      errorMessage = 'Location request timed out. Move to an open area and try again.';
      break;
    default:
      status = 'location_unavailable';
      errorMessage = 'An unknown error occurred while retrieving your location.';
  }
  persist();
  notify();
  // A one-off error must never kill an active watcher — the GPS hardware often
  // recovers and emits fixes again. Only call the server for one-off acquire
  // failures so the Admin view reflects a status that is not "tracking".
  if (!isWatch || status === 'location_permission_denied') {
    void pushToBackend(status);
  }
}

function watchOptions(): PositionOptions {
  return { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
}

export const liveTracking = {
  getSnapshot(): LiveTrackingSnapshot {
    return snapshot();
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  isTracking(): boolean {
    return status === 'tracking_active';
  },

  /** Attach the assigned geo-fence the salesperson is being tracked against. */
  setFenceContext(fence: GeoFence | null | undefined): void {
    fenceId = fence?._id ?? null;
    fenceName = fence?.name ?? '';
    fenceCenterLat = Number(fence?.centerLat) || 0;
    fenceCenterLng = Number(fence?.centerLng) || 0;
    fenceRadiusMeters = Number(fence?.radiusMeters) || 0;
    if (coords) evaluateFence();
    persist();
  },

  /**
   * Start (or re-start) live tracking. Always cleans up any previous watcher
   * before creating a new one — exactly one watchPosition() listener exists.
   */
  startTracking(fence?: GeoFence | null): void {
    if (fence) liveTracking.setFenceContext(fence);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      status = 'not_tracking';
      errorMessage = 'Geolocation is not supported by this browser. Use a modern browser on a device with GPS.';
      notify();
      return;
    }

    // Requirement: never create a duplicated watcher.
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    status = 'tracking_active';
    errorMessage = '';
    persist();
    notify();

    watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      watchOptions(),
    );
  },

  /** Stop the watcher and mark the session stopped (last position is kept for the Admin view). */
  stopTracking(): void {
    if (typeof navigator !== 'undefined' && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    status = 'tracking_stopped';
    updatedAt = new Date().toISOString();
    persist();
    notify();
    void pushToBackend('tracking_stopped');
  },

  /**
   * Called on page unload / logout. The browser will tear the watcher down on a
   * full page load anyway; this marks the backend session as stopped with a
   * keepalive request so the Admin view does not show a stale "Tracking Active".
   */
  async stopForUnload(): Promise<void> {
    if (typeof navigator !== 'undefined' && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    status = 'tracking_stopped';
    updatedAt = new Date().toISOString();
    persist();
    notify();

    const fix = coords;
    const payload = {
      latitude: fix?.lat ?? null,
      longitude: fix?.lng ?? null,
      accuracyMeters: fix?.accuracy ?? null,
      trackingStatus: 'tracking_stopped',
      timestamp: new Date().toISOString(),
      fenceId,
    };
    try {
      await fetch('/api/sales/live-location', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${document.cookie
            .split('; ')
            .find((c) => c.startsWith('admin_token='))
            ?.split('=')[1] || ''}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      /* best-effort */
    }
  },

  /** Restore the last known session metadata (used on full page reloads). */
  restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw) as PersistedState;
      if (!state || typeof state !== 'object') return;
      coords = state.coords ?? null;
      fenceId = state.fenceId ?? null;
      fenceName = state.fenceName ?? '';
      updatedAt = state.updatedAt ?? null;
      fixAt = state.fixAt ?? null;
      status = coords ? 'last_location_available' : 'not_tracking';
      if (coords) evaluateFence();
    } catch {
      /* ignore */
    }
  },

  statusLabel(statusValue: TrackingStatus = status): string {
    switch (statusValue) {
      case 'tracking_active': return 'Tracking Active';
      case 'tracking_stopped': return 'Tracking Stopped';
      case 'location_permission_denied': return 'Location Permission Denied';
      case 'location_unavailable': return 'Location Unavailable';
      case 'last_location_available': return 'Last Location Available';
      default: return 'Not Tracking';
    }
  },
};

// Register page-unload handling once at import time.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    void liveTracking.stopForUnload();
  });
}