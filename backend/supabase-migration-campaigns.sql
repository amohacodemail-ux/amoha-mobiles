-- ============================================================
-- AMOHA Mobiles — Campaigns Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  description TEXT DEFAULT '',
  
  -- Targeting
  target_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'segment')),
  target_segment VARCHAR(50), -- e.g., 'vip', 'loyal', 'regular', 'new'
  
  -- Products
  product_target_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (product_target_type IN ('all', 'products', 'category')),
  product_ids UUID[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Associated Coupon
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Schedule
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  
  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_segment ON campaigns(target_segment);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
