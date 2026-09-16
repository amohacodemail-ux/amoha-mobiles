-- ============================================================
-- AMOHA Mobiles - Sales SalesJump Modules Migration
-- Run this in your Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- 1. GEO-FENCES
CREATE TABLE IF NOT EXISTS geo_fences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  center_lat NUMERIC(10,6) NOT NULL,
  center_lng NUMERIC(10,6) NOT NULL,
  radius_meters INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geo_fences_active ON geo_fences(is_active);

-- 2. EXPENSES: Add speedometer columns
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS speedometer_start INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS speedometer_end INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS speedometer_photo_url TEXT DEFAULT '';
ALTER TABLE daily_activities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6);
ALTER TABLE daily_activities ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);
ALTER TABLE sales_attendance ADD COLUMN IF NOT EXISTS checkin_latitude NUMERIC(10,6);
ALTER TABLE sales_attendance ADD COLUMN IF NOT EXISTS checkin_longitude NUMERIC(10,6);
ALTER TABLE sales_attendance ADD COLUMN IF NOT EXISTS checkout_latitude NUMERIC(10,6);
ALTER TABLE sales_attendance ADD COLUMN IF NOT EXISTS checkout_longitude NUMERIC(10,6);
