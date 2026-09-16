-- ============================================================
-- AMOHA Mobiles - Geo-Tag / Geo-Fence Location History Migration
-- Run this in your Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- 1. GEO-TAGS (salesperson field location history)
CREATE TABLE IF NOT EXISTS geo_tags (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name       TEXT         NOT NULL DEFAULT '',           -- snapshot of salesperson name
  latitude        NUMERIC(10,8) NOT NULL,
  longitude       NUMERIC(11,8) NOT NULL,
  accuracy_meters NUMERIC(10,2),
  address         TEXT         NOT NULL DEFAULT '',
  visit_type      TEXT         NOT NULL DEFAULT 'other'
    CHECK (visit_type IN ('productive','non_productive','office','travel','other')),
  fence_id        UUID         REFERENCES geo_fences(id) ON DELETE SET NULL,
  fence_name      TEXT         NOT NULL DEFAULT '',
  in_fence        BOOLEAN,
  distance_meters NUMERIC(12,2),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_tags_user    ON geo_tags(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_tags_created ON geo_tags(created_at DESC);

-- 2. GEO-FENCES: allow assigning a fence to a specific salesperson
ALTER TABLE geo_fences ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_geo_fences_assigned ON geo_fences(assigned_user_id);

-- 3. GEO-TAGS: snapshot the exact assigned territory used at capture time
--    (each saved location keeps the centre + radius even if the fence changes later)
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_center_lat NUMERIC(10,8);
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_center_lng NUMERIC(11,8);
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_radius_meters INTEGER;

-- 4. Refresh PostgREST schema cache so the API sees the new table/columns immediately
--    (otherwise inserts into geo_tags fail with "PGRST205 table not found in schema cache")
NOTIFY pgrst, 'reload schema';