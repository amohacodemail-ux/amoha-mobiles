-- ============================================================
-- AMOHA Mobiles – V3 Migration: Supplier Entries, Inventory Ledger, Audit Trail
-- Run AFTER supabase-migration-v2.sql
-- ============================================================

-- ===================== SUPPLIER ENTRIES =====================
-- Simple input table for suppliers (NOT products, NOT inventory)
CREATE TABLE IF NOT EXISTS supplier_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) DEFAULT NULL,
  note TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','converted','rejected')),
  -- Conversion tracking
  converted_product_id UUID REFERENCES products(id),
  converted_by UUID REFERENCES users(id),
  converted_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supplier_entries_supplier ON supplier_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_entries_status ON supplier_entries(status);
CREATE INDEX IF NOT EXISTS idx_supplier_entries_created ON supplier_entries(created_at DESC);

-- ===================== INVENTORY LEDGER =====================
-- The REAL inventory table - auto-created when product is created from supplier entry
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Keep this nullable and unbound so V3 can run even if the supplier master table is not installed yet
  supplier_id UUID,
  supplier_entry_id UUID REFERENCES supplier_entries(id),
  total_stock INTEGER NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
  available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  sold_stock INTEGER NOT NULL DEFAULT 0 CHECK (sold_stock >= 0),
  damaged_stock INTEGER NOT NULL DEFAULT 0 CHECK (damaged_stock >= 0),
  cost_price DECIMAL(10,2) DEFAULT 0,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(available_stock);

-- ===================== INVENTORY AUDIT LOG =====================
-- Every stock change is recorded here for traceability
CREATE TABLE IF NOT EXISTS inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  action VARCHAR(50) NOT NULL
    CHECK (action IN (
      'created',
      'order_placed',
      'order_cancelled',
      'order_delivered',
      'stock_added',
      'stock_removed',
      'stock_adjusted',
      'damaged',
      'returned',
      'reserved',
      'unreserved'
    )),
  quantity_changed INTEGER NOT NULL DEFAULT 0,
  before_state JSONB NOT NULL DEFAULT '{}',
  after_state JSONB NOT NULL DEFAULT '{}',
  reference_type VARCHAR(30) CHECK (reference_type IN ('order','supplier_entry','manual','return','damage')),
  reference_id UUID,
  notes TEXT DEFAULT '',
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_audit_inventory ON inventory_audit_log(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_audit_product ON inventory_audit_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_audit_action ON inventory_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_inv_audit_created ON inventory_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_audit_reference ON inventory_audit_log(reference_type, reference_id);

-- ===================== ADD SUPPLIER ROLE TO USERS =====================
-- Expand the role CHECK constraint to include 'supplier'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user','admin','digital_marketing','sales','marketing','purchase_inventory','logistics','supplier'));

-- ===================== USEFUL VIEW =====================
CREATE OR REPLACE VIEW inventory_overview AS
SELECT
  i.id AS inventory_id,
  i.product_id,
  p.name AS product_name,
  p.sku,
  p.thumbnail,
  p.selling_price,
  b.name AS brand_name,
  c.name AS category_name,
  i.supplier_id,
  NULL::TEXT AS supplier_name,
  i.total_stock,
  i.available_stock,
  i.reserved_stock,
  i.sold_stock,
  i.damaged_stock,
  i.cost_price,
  i.last_restocked_at,
  i.updated_at,
  CASE
    WHEN i.available_stock = 0 THEN 'out_of_stock'
    WHEN i.available_stock <= 5 THEN 'critical'
    WHEN i.available_stock <= 10 THEN 'low'
    ELSE 'in_stock'
  END AS stock_status
FROM inventory i
JOIN products p ON p.id = i.product_id
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true;
