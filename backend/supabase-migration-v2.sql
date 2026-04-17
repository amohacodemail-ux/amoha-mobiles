-- ============================================================
-- AMOHA Mobiles – Supplier, Customer & Inventory Management
-- Run AFTER the original supabase-migration.sql
-- ============================================================

-- ===================== SUPPLIER MANAGEMENT =====================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  contact_person VARCHAR(200),
  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  bank_name VARCHAR(200),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  payment_terms VARCHAR(200) DEFAULT 'Net 30',
  -- Performance metrics
  reliability_score DECIMAL(3,1) DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 5),
  avg_delivery_days DECIMAL(5,1) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  defect_rate DECIMAL(5,2) DEFAULT 0 CHECK (defect_rate >= 0 AND defect_rate <= 100),
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Supplier-Product Mapping
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  lead_time_days INTEGER DEFAULT 7,
  min_order_qty INTEGER DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  last_supplied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','confirmed','partially_received','received','cancelled')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
  received_qty INTEGER NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- ===================== CUSTOMER MANAGEMENT =====================

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  segment VARCHAR(30) NOT NULL DEFAULT 'regular'
    CHECK (segment IN ('vip','frequent','regular','inactive','new')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id)
);
CREATE INDEX idx_customer_segments_user ON customer_segments(user_id);
CREATE INDEX idx_customer_segments_segment ON customer_segments(segment);

-- Customer Tags
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag)
);
CREATE INDEX idx_customer_tags_user ON customer_tags(user_id);
CREATE INDEX idx_customer_tags_tag ON customer_tags(tag);

-- Customer Notes (admin notes per customer)
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'note'
    CHECK (type IN ('note','call','email','meeting','follow_up','complaint')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customer_notes_user ON customer_notes(user_id);
CREATE INDEX idx_customer_notes_admin ON customer_notes(admin_id);

-- Fraud Flags
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL
    CHECK (flag_type IN ('multiple_failed_payments','excessive_returns','suspicious_activity','chargebacks','address_mismatch','velocity_abuse')),
  severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  description TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  auto_detected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fraud_flags_user ON fraud_flags(user_id);
CREATE INDEX idx_fraud_flags_type ON fraud_flags(flag_type);
CREATE INDEX idx_fraud_flags_resolved ON fraud_flags(is_resolved);

-- ===================== INVENTORY MANAGEMENT =====================

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address_line1 VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  manager_name VARCHAR(200),
  manager_phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

-- Warehouse Stock (stock per product per warehouse)
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  max_stock_level INTEGER DEFAULT 1000,
  reorder_point INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);
CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX idx_warehouse_stock_product ON warehouse_stock(product_id);

-- Inventory Movements (stock in/out log)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('in','out','adjustment','transfer','return','damage')),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(30)
    CHECK (reference_type IN ('purchase_order','order','return','manual','transfer','damage')),
  reference_id UUID,
  before_qty INTEGER NOT NULL DEFAULT 0,
  after_qty INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(type);
CREATE INDEX idx_inv_movements_created ON inventory_movements(created_at DESC);

-- Stock Alerts
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  alert_type VARCHAR(20) NOT NULL DEFAULT 'low_stock'
    CHECK (alert_type IN ('low_stock','out_of_stock','overstock','expiring')),
  current_stock INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 0,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_type ON stock_alerts(alert_type);
CREATE INDEX idx_stock_alerts_ack ON stock_alerts(is_acknowledged);

-- Inventory Forecasts (basic prediction snapshots)
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_demand INTEGER NOT NULL DEFAULT 0,
  avg_daily_sales DECIMAL(8,2) DEFAULT 0,
  days_of_stock_remaining INTEGER DEFAULT 0,
  reorder_recommended BOOLEAN DEFAULT false,
  recommended_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, forecast_date)
);
CREATE INDEX idx_inv_forecasts_product ON inventory_forecasts(product_id);
CREATE INDEX idx_inv_forecasts_date ON inventory_forecasts(forecast_date);

-- ===================== USEFUL VIEWS =====================

-- Supplier performance summary
CREATE OR REPLACE VIEW supplier_performance AS
SELECT
  s.id,
  s.name,
  s.code,
  s.status,
  s.reliability_score,
  s.avg_delivery_days,
  s.total_orders,
  s.on_time_deliveries,
  s.defect_rate,
  CASE WHEN s.total_orders > 0
    THEN ROUND((s.on_time_deliveries::DECIMAL / s.total_orders) * 100, 1)
    ELSE 0 END AS on_time_pct,
  COUNT(DISTINCT sp.product_id) AS product_count,
  COALESCE(SUM(po.total_amount), 0) AS total_purchase_value
FROM suppliers s
LEFT JOIN supplier_products sp ON sp.supplier_id = s.id
LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status != 'cancelled'
GROUP BY s.id;

-- Customer analytics view
CREATE OR REPLACE VIEW customer_analytics AS
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.created_at AS registered_at,
  COALESCE(cs.segment, 'regular') AS segment,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_spent,
  MAX(o.created_at) AS last_order_at,
  COALESCE(AVG(o.total), 0) AS avg_order_value,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END) AS returned_orders,
  COUNT(DISTINCT ff.id) AS fraud_flag_count
FROM users u
LEFT JOIN customer_segments cs ON cs.user_id = u.id
LEFT JOIN orders o ON o.user_id = u.id
LEFT JOIN fraud_flags ff ON ff.user_id = u.id AND ff.is_resolved = false
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.email, u.phone, u.created_at, cs.segment;

-- Low stock alert view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id AS product_id,
  p.name,
  p.sku,
  p.stock AS total_stock,
  p.selling_price,
  b.name AS brand_name,
  c.name AS category_name,
  CASE
    WHEN p.stock = 0 THEN 'out_of_stock'
    WHEN p.stock <= 5 THEN 'critical'
    WHEN p.stock <= 10 THEN 'low'
    ELSE 'normal'
  END AS stock_status
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND p.stock <= 10
ORDER BY p.stock ASC;
