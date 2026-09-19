-- ============================================================
-- AMOHA Mobiles - Live Location Tracking Migration
-- Run this in your Supabase SQL Editor. Safe to re-run.
-- Pre-requisite: geo_fences table must exist (Geo-Tag migration).
-- ============================================================

-- 1. LIVE LOCATIONS (latest live position per salesperson, upserted continuously)
CREATE TABLE IF NOT EXISTS live_locations (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name              TEXT         NOT NULL DEFAULT '',
  latitude               NUMERIC(10,8),
  longitude              NUMERIC(11,8),
  accuracy_meters        NUMERIC(10,2),
  timestamp              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tracking_status        TEXT         NOT NULL DEFAULT 'not_tracking'
    CHECK (tracking_status IN ('not_tracking','tracking_active','tracking_stopped','location_permission_denied','location_unavailable','last_location_available')),
  geofence_status        TEXT
    CHECK (geofence_status IS NULL OR geofence_status IN ('inside','outside')),
  distance_from_geofence NUMERIC(12,2),
  fence_id               UUID         REFERENCES geo_fences(id) ON DELETE SET NULL,
  fence_name             TEXT         NOT NULL DEFAULT '',
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT live_locations_salesperson_unique UNIQUE (salesperson_id)
);

CREATE INDEX IF NOT EXISTS idx_live_locations_salesperson ON live_locations(salesperson_id, updated_at DESC);

-- 2. Refresh PostgREST schema cache so the API sees the new table immediately
NOTIFY pgrst, 'reload schema';