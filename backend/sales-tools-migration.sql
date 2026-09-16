-- ============================================================
-- AMOHA Mobiles — Sales Tools Module Migration
-- Run this SQL in Supabase SQL Editor (Table Editor > SQL)
-- This creates ALL tables needed for Sales Tools modules
-- ============================================================
-- Run AFTER the main supabase-migration.sql
-- ============================================================

-- ===================== DAILY ACTIVITIES =====================

CREATE TABLE IF NOT EXISTS daily_activities (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  customer_name     VARCHAR(200) NOT NULL DEFAULT '',
  visit_type        VARCHAR(20) NOT NULL DEFAULT 'productive'
    CHECK (visit_type IN ('productive','non_productive','office','travel','other')),
  location          TEXT        NOT NULL DEFAULT '',
  notes             TEXT        NOT NULL DEFAULT '',
  status            VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed','pending','cancelled')),
  products_demoed   TEXT        NOT NULL DEFAULT '',
  order_value       DECIMAL(10,2) NOT NULL DEFAULT 0,
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user       ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date       ON daily_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date  ON daily_activities(user_id, activity_date DESC);

CREATE TRIGGER trg_daily_activities_updated_at
  BEFORE UPDATE ON daily_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== TOUR PLANS =====================

CREATE TABLE IF NOT EXISTS tour_plans (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  title            VARCHAR(300) NOT NULL DEFAULT 'My Day Plan',
  areas            TEXT        NOT NULL DEFAULT '',
  planned_visits   INTEGER     NOT NULL DEFAULT 0,
  completed_visits INTEGER     NOT NULL DEFAULT 0,
  notes            TEXT        NOT NULL DEFAULT '',
  status           VARCHAR(20) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','in_progress','completed','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_tour_plans_user      ON tour_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_plans_date      ON tour_plans(plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_tour_plans_user_date ON tour_plans(user_id, plan_date DESC);

CREATE TRIGGER trg_tour_plans_updated_at
  BEFORE UPDATE ON tour_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== SALES TARGETS =====================

CREATE TABLE IF NOT EXISTS sales_targets (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month           INTEGER     NOT NULL CHECK (month >= 1 AND month <= 12),
  year            INTEGER     NOT NULL CHECK (year >= 2020),
  target_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  achieved_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_count    INTEGER     NOT NULL DEFAULT 0,
  achieved_count  INTEGER     NOT NULL DEFAULT 0,
  notes           TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_user      ON sales_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_user_year ON sales_targets(user_id, year, month);

CREATE TRIGGER trg_sales_targets_updated_at
  BEFORE UPDATE ON sales_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== EXPENSES =====================

CREATE TABLE IF NOT EXISTS expenses (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  category              VARCHAR(30) NOT NULL DEFAULT 'other'
    CHECK (category IN ('travel','food','accommodation','mobile','stationary','entertainment','other')),
  amount                DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  description           TEXT        NOT NULL DEFAULT '',
  receipt_url           TEXT        NOT NULL DEFAULT '',
  travel_mode           VARCHAR(50) NOT NULL DEFAULT '',
  distance_km           DECIMAL(8,2) NOT NULL DEFAULT 0,
  speedometer_start     INTEGER,
  speedometer_end       INTEGER,
  speedometer_photo_url TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_by           UUID        REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user        ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date        ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date   ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status      ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category    ON expenses(category);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== SALES ATTENDANCE =====================

CREATE TABLE IF NOT EXISTS sales_attendance (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  check_in             TIMESTAMPTZ,
  check_out            TIMESTAMPTZ,
  location_check_in    TEXT        NOT NULL DEFAULT '',
  location_check_out   TEXT        NOT NULL DEFAULT '',
  checkin_latitude     DECIMAL(10,8),
  checkin_longitude    DECIMAL(11,8),
  checkout_latitude    DECIMAL(10,8),
  checkout_longitude   DECIMAL(11,8),
  status               VARCHAR(20) NOT NULL DEFAULT 'absent'
    CHECK (status IN ('present','absent','half_day','on_leave','holiday')),
  notes                TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_sales_attendance_user      ON sales_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_attendance_date      ON sales_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_attendance_user_date ON sales_attendance(user_id, attendance_date DESC);

CREATE TRIGGER trg_sales_attendance_updated_at
  BEFORE UPDATE ON sales_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== LEAVE REQUESTS =====================

CREATE TABLE IF NOT EXISTS leave_requests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_date   DATE        NOT NULL,
  to_date     DATE        NOT NULL,
  leave_type  VARCHAR(20) NOT NULL DEFAULT 'casual'
    CHECK (leave_type IN ('casual','sick','earned','maternity','paternity','emergency','other')),
  reason      TEXT        NOT NULL,
  half_day    BOOLEAN     NOT NULL DEFAULT false,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID        REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  remarks     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user   ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates  ON leave_requests(from_date, to_date);

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== GEO FENCES =====================

CREATE TABLE IF NOT EXISTS geo_fences (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(200) NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  center_lat     DECIMAL(10,8) NOT NULL,
  center_lng     DECIMAL(11,8) NOT NULL,
  radius_meters  INTEGER     NOT NULL DEFAULT 500 CHECK (radius_meters > 0),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_by     UUID        REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_fences_active ON geo_fences(is_active);

CREATE TRIGGER trg_geo_fences_updated_at
  BEFORE UPDATE ON geo_fences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFY: List all tables created
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'daily_activities','tour_plans','sales_targets','expenses',
    'sales_attendance','leave_requests','geo_fences'
  )
ORDER BY table_name;

-- ============================================================
-- APPROVAL WORKFLOW MIGRATION (add to existing tables)
-- Run this AFTER creating the main sales tables above
-- ============================================================

-- Add approval columns to daily_activities
ALTER TABLE daily_activities
  ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_daily_activities_approval ON daily_activities(approval_status);

-- Add approval columns to tour_plans
ALTER TABLE tour_plans
  ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tour_plans_approval ON tour_plans(approval_status);

-- ============================================================
-- RELOAD POSTGREST SCHEMA CACHE
-- Required after ALTER TABLE so the API sees new columns
-- (e.g. daily_activities.approval_status). Without this you get:
-- "Could not find the 'approval_status' column of 'daily_activities' in the schema cache"
-- ============================================================
NOTIFY pgrst, 'reload schema';
