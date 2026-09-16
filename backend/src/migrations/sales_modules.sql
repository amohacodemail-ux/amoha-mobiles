-- ============================================================
-- AMOHA Mobiles - Sales Module Tables Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ===========================
-- 1. DAILY ACTIVITIES
-- ===========================
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT DEFAULT '',
  visit_type TEXT DEFAULT 'productive' CHECK (visit_type IN ('productive', 'non_productive', 'office', 'travel', 'other')),
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  products_demoed TEXT DEFAULT '',
  order_value NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON daily_activities(user_id, activity_date DESC);

-- ===========================
-- 2. TOUR PLANS / DAY PLANS
-- ===========================
CREATE TABLE IF NOT EXISTS tour_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT DEFAULT 'My Day Plan',
  areas TEXT DEFAULT '',          -- Areas/routes planned to visit
  planned_visits INTEGER DEFAULT 0,
  completed_visits INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date)    -- One plan per day per user
);

CREATE INDEX IF NOT EXISTS idx_tour_plans_user_date ON tour_plans(user_id, plan_date DESC);

-- ===========================
-- 3. SALES TARGETS
-- ===========================
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  target_amount NUMERIC(14,2) DEFAULT 0,
  achieved_amount NUMERIC(14,2) DEFAULT 0,
  target_count INTEGER DEFAULT 0,     -- Number of bills/orders target
  achieved_count INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_user_month ON sales_targets(user_id, year, month);

-- ===========================
-- 4. EXPENSES
-- ===========================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'travel' CHECK (category IN ('travel', 'food', 'accommodation', 'mobile', 'stationary', 'entertainment', 'other')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  receipt_url TEXT DEFAULT '',
  travel_mode TEXT DEFAULT '',    -- bike, car, auto, bus, train etc.
  distance_km NUMERIC(8,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- ===========================
-- 5. ATTENDANCE
-- ===========================
CREATE TABLE IF NOT EXISTS sales_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  location_check_in TEXT DEFAULT '',
  location_check_out TEXT DEFAULT '',
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'holiday')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_sales_attendance_user_date ON sales_attendance(user_id, attendance_date DESC);

-- ===========================
-- 6. LEAVE REQUESTS
-- ===========================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  leave_type TEXT DEFAULT 'casual' CHECK (leave_type IN ('casual', 'sick', 'earned', 'maternity', 'paternity', 'emergency', 'other')),
  reason TEXT NOT NULL,
  half_day BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- ===========================
-- Row Level Security (Optional but recommended)
-- Uncomment if you want Supabase RLS policies
-- ===========================
-- ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tour_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ===========================
-- Verification
-- ===========================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('daily_activities','tour_plans','sales_targets','expenses','sales_attendance','leave_requests');

COMMENT ON TABLE daily_activities IS 'Sales user daily field activity log';
COMMENT ON TABLE tour_plans IS 'Sales user day plan / tour route';
COMMENT ON TABLE sales_targets IS 'Monthly sales targets assigned by admin';
COMMENT ON TABLE expenses IS 'Sales user expense claims';
COMMENT ON TABLE sales_attendance IS 'Sales user daily attendance with check-in/out';
COMMENT ON TABLE leave_requests IS 'Sales user leave applications';
