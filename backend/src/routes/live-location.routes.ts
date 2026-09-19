import { Router, Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/auth.middleware';
import { authorize, normalizeRole } from '../middleware/role.middleware';
import { sendSuccess } from '../utils/response.util';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../errors/app-error';
import { verifyAccessToken } from '../utils/jwt.util';
import { addLiveStreamClient, removeLiveStreamClient, broadcastLiveLocation } from '../services/live-location-stream.service';

const router = Router();

export const TRACKING_STATUSES = [
  'not_tracking',
  'tracking_active',
  'tracking_stopped',
  'location_permission_denied',
  'location_unavailable',
  'last_location_available',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

/** Haversine distance between two coordinates in meters (same formula as geo-tag). */
function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(la2 - la1);
  const dLng = r(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isValidLat(lat: number): boolean {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Authenticate the SSE stream. EventSource cannot set an Authorization header,
 * so we accept (in order): Bearer header, `admin_token` cookie (sent through the
 * Next.js rewrite proxy), or a `?token=` query fallback.
 */
function authenticateStream(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1] || null;
    }
    if (!token) {
      const cookie = req.headers.cookie || '';
      const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
      token = match ? decodeURIComponent(match[1]) : null;
    }
    if (!token) {
      const q = req.query.token;
      token = typeof q === 'string' && q ? q : null;
    }
    if (!token) throw new UnauthorizedError('Access token is required');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') throw new UnauthorizedError('Access token has expired');
      throw new UnauthorizedError('Invalid access token');
    }

    if (normalizeRole(decoded.role) !== 'admin') {
      throw new ForbiddenError('Only admins can view the live location stream');
    }
    (req as AuthenticatedRequest).user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    next(error);
  }
}

// ============================================================
// POST /api/sales/live-location
// Upserts the logged-in salesperson's LATEST live location.
// A salesperson can only ever write their OWN row (salesperson_id
// always comes from the JWT — never from the request body).
// ============================================================
router.post('/live-location', authenticate, authorize('sales'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const { latitude, longitude, accuracyMeters, trackingStatus, timestamp, fenceId } = req.body;

    const status = trackingStatus && TRACKING_STATUSES.includes(trackingStatus)
      ? trackingStatus
      : 'tracking_active';

    const hasCoords = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (hasCoords) {
      lat = parseFloat(latitude);
      lng = parseFloat(longitude);
      if (!isValidLat(lat) || !isValidLng(lng)) {
        throw new ValidationError('Valid latitude (-90 to 90) and longitude (-180 to 180) are required');
      }
    }
    const accuracy = accuracyMeters !== undefined && accuracyMeters !== null && !isNaN(parseFloat(accuracyMeters))
      ? parseFloat(accuracyMeters)
      : null;
    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();
    const parsedTimestamp = isNaN(eventTimestamp.getTime()) ? new Date() : eventTimestamp;

    // Salesperson name snapshot for the admin live-tracking view.
    const { data: user, error: userErr } = await supabase.from('users').select('id, name, email').eq('id', userId).maybeSingle();
    if (userErr) throw userErr;

    // Resolve the assigned active territory for geofence evaluation.
    // A client-supplied fenceId must actually be assigned to this salesperson.
    let fenceRef: any = null;
    if (fenceId) {
      const { data: fence, error: fenceErr } = await supabase.from('geo_fences').select('*').eq('id', fenceId).maybeSingle();
      if (fenceErr) throw fenceErr;
      if (!fence) throw new ValidationError('The selected geo-fence does not exist');
      if (!fence.is_active) throw new ValidationError('The selected geo-fence is inactive');
      if (fence.assigned_user_id !== userId) throw new ForbiddenError('You can only track your location against geo-fences assigned to you');
      fenceRef = fence;
    } else if (hasCoords || status === 'tracking_active') {
      const { data: fences, error: fencesErr } = await supabase
        .from('geo_fences')
        .select('*')
        .eq('is_active', true)
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (fencesErr) throw fencesErr;
      fenceRef = (fences && fences[0]) || null;
    } else {
      // Status-only update (e.g. permission denied / stopped): keep existing fence ref.
      const { data: existing } = await supabase.from('live_locations').select('fence_id').eq('salesperson_id', userId).maybeSingle();
      if (existing?.fence_id) {
        const { data: fence } = await supabase.from('geo_fences').select('*').eq('id', existing.fence_id).maybeSingle();
        fenceRef = fence || null;
      }
    }

    // Compute geofence status server-side — never trust the client.
    let geofenceStatus: 'inside' | 'outside' | null = null;
    let distance: number | null = null;
    if (hasCoords && fenceRef) {
      distance = Math.round(haversine(lat!, lng!, parseFloat(fenceRef.center_lat), parseFloat(fenceRef.center_lng)));
      geofenceStatus = distance <= fenceRef.radius_meters ? 'inside' : 'outside';
    }

    const { data: existing, error: findErr } = await supabase
      .from('live_locations')
      .select('id')
      .eq('salesperson_id', userId)
      .maybeSingle();
    if (findErr) throw findErr;

    const row = {
      salesperson_id: userId,
      user_name: user?.name || user?.email || '',
      latitude: hasCoords ? lat : (existing ? undefined : null),
      longitude: hasCoords ? lng : (existing ? undefined : null),
      accuracy_meters: hasCoords ? accuracy : (existing ? undefined : null),
      timestamp: parsedTimestamp.toISOString(),
      tracking_status: status,
      geofence_status: hasCoords ? geofenceStatus : (existing ? undefined : null),
      distance_from_geofence: hasCoords ? distance : (existing ? undefined : null),
      fence_id: fenceRef?.id ?? null,
      fence_name: fenceRef?.name || '',
      updated_at: new Date().toISOString(),
    };

    // Clean undefined fields so Supabase does not try to set them to NULL.
    const cleanRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v !== undefined) cleanRow[k] = v;
    }

    let data: any;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('live_locations')
        .update(cleanRow)
        .eq('salesperson_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      data = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('live_locations')
        .insert(cleanRow)
        .select('*')
        .single();
      if (error) throw error;
      data = inserted;
    }

    const transformed = transformRow(data);
    // Push to all connected Admin live-tracking views (real-time).
    broadcastLiveLocation(transformed);

    sendSuccess(res, transformed, status === 'tracking_active' ? 'Live location updated' : 'Tracking status updated');
  } catch (error) { next(error); }
});

// ============================================================
// GET /api/sales/live-locations
// Admin: every salesperson's latest live location.
// Sales: only their own row (never another salesperson's location).
// ============================================================
router.get('/live-locations', authenticate, authorize('admin', 'sales'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    if (req.user!.role === 'admin') {
      let query = supabase
        .from('live_locations')
        .select('*, user:salesperson_id(id,name,email)')
        .order('updated_at', { ascending: false });
      if (req.query.userId) {
        query = (query as any).eq('salesperson_id', req.query.userId as string);
      }
      const { data, error } = await query;
      if (error) throw error;
      return sendSuccess(res, (data || []).map(transformRow), 'Live locations fetched');
    }

    // Sales role: own record only.
    const { data, error } = await supabase
      .from('live_locations')
      .select('*, user:salesperson_id(id,name,email)')
      .eq('salesperson_id', req.user!.userId)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    sendSuccess(res, (data || []).map(transformRow), 'Live locations fetched');
  } catch (error) { next(error); }
});

// ============================================================
// GET /api/sales/live-locations/stream  (SSE — Admin only)
// Real-time push of live-location updates to the Admin dashboard.
// ============================================================
router.get('/live-locations/stream', authenticateStream, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write('retry: 3000\n\n');
  addLiveStreamClient(res);

  const cleanup = () => {
    removeLiveStreamClient(res);
  };
  req.on('close', cleanup);
  res.on('error', cleanup);
  res.on('close', cleanup);
});

export default router;