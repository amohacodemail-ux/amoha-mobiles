-- ============================================================
-- AMOHA Mobiles — Attendance Correction / Reopen workflow ROLLBACK
--
-- The Attendance Correction / Reopen feature has been removed from the app.
-- Run this SQL in Supabase SQL Editor ONLY if you applied
--   supabase-migration-attendance-corrections.sql (or the v16 migration)
-- earlier and want to remove its database footprint.
--
-- Safe to re-run: uses IF EXISTS / IF NOT EXISTS.
-- Does NOT delete any sales_attendance records (attendance data is kept).
-- ============================================================

-- 1) Drop the correction audit table (created by this feature only)
DROP INDEX IF EXISTS idx_attendance_corrections_attendance;
DROP INDEX IF EXISTS idx_attendance_corrections_status;
DROP INDEX IF EXISTS idx_attendance_corrections_user;
DROP TABLE IF EXISTS attendance_corrections;

-- 2) Drop correction columns from sales_attendance (columns are unused now)
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_requested;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_reason;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_status;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_rejection_reason;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_approved_by;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_approved_at;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_action;
ALTER TABLE sales_attendance DROP COLUMN IF EXISTS correction_requested_check_out;

DROP INDEX IF EXISTS idx_sales_attendance_correction;

-- 3) Reload PostgREST schema cache so the API sees the removed columns immediately
NOTIFY pgrst, 'reload schema';