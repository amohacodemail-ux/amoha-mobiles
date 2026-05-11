-- ============================================================
-- AMOHA Mobiles – Supplier Management Module Fixes
-- ERP-grade reliability, deduplication, and data integrity
-- ============================================================

-- ============================================================
-- 1. ADD UNIQUE CONSTRAINTS TO PREVENT DUPLICATE SUPPLIERS
-- ============================================================

-- Add unique constraint on email (case-insensitive, allowing NULL)
-- First, normalize existing emails to lowercase
UPDATE suppliers SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Handle duplicate emails before adding constraint
-- Keep the oldest supplier (by created_at) when duplicates exist
WITH ranked AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY created_at ASC) as rn
  FROM suppliers 
  WHERE email IS NOT NULL AND email != ''
)
-- Clear duplicate emails from newer records
UPDATE suppliers 
SET email = NULL 
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Add unique index that allows multiple NULLs but unique non-null values
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_email_unique 
  ON suppliers(email) 
  WHERE email IS NOT NULL AND email != '';

-- Normalize phone numbers and add unique constraint
-- First, remove non-numeric characters from phone
UPDATE suppliers 
  SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
  WHERE phone IS NOT NULL;

-- Handle duplicate phones
-- Keep the oldest supplier (by created_at) when duplicates exist
WITH phone_ranked AS (
  SELECT 
    id,
    phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM suppliers 
  WHERE phone IS NOT NULL AND phone != ''
)
-- Clear duplicate phones from newer records
UPDATE suppliers 
SET phone = NULL 
WHERE id IN (SELECT id FROM phone_ranked WHERE rn > 1);

-- Add unique index for phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_phone_unique 
  ON suppliers(phone) 
  WHERE phone IS NOT NULL AND phone != '';

-- ============================================================
-- 2. ADD COMPANY NAME FIELD
-- ============================================================

ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(300);

-- Set company_name to name for existing records if empty
UPDATE suppliers 
  SET company_name = name 
  WHERE company_name IS NULL OR company_name = '';

-- ============================================================
-- 3. ADD DATA CONSISTENCY TRIGGERS
-- ============================================================

-- Function to normalize phone numbers
CREATE OR REPLACE FUNCTION normalize_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone = REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g');
    -- Remove leading zeros beyond country code format
    IF LENGTH(NEW.phone) > 10 AND NEW.phone LIKE '0%' THEN
      NEW.phone = SUBSTRING(NEW.phone FROM 2);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply phone normalization before insert/update
DROP TRIGGER IF EXISTS trg_normalize_phone ON suppliers;
CREATE TRIGGER trg_normalize_phone
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_phone();

-- Function to lowercase email
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = LOWER(TRIM(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply email normalization
DROP TRIGGER IF EXISTS trg_normalize_email ON suppliers;
CREATE TRIGGER trg_normalize_email
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_email();

-- ============================================================
-- 4. ADD FOREIGN KEY CHECK FOR SUPPLIER DELETION
-- ============================================================

-- Function to check for linked records before deletion
CREATE OR REPLACE FUNCTION check_supplier_deletable()
RETURNS TRIGGER AS $$
DECLARE
  po_count INTEGER;
  sp_count INTEGER;
  entry_count INTEGER;
BEGIN
  -- Check for purchase orders
  SELECT COUNT(*) INTO po_count 
  FROM purchase_orders 
  WHERE supplier_id = OLD.id;
  
  IF po_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete supplier: % purchase order(s) linked. Archive or reassign first.', po_count;
  END IF;
  
  -- Check for supplier products
  SELECT COUNT(*) INTO sp_count 
  FROM supplier_products 
  WHERE supplier_id = OLD.id;
  
  IF sp_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete supplier: % product(s) linked. Remove product associations first.', sp_count;
  END IF;
  
  -- Check for supplier entries
  SELECT COUNT(*) INTO entry_count 
  FROM supplier_entries 
  WHERE supplier_id = OLD.id;
  
  IF entry_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete supplier: % supplier entry(s) linked.', entry_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply deletion check
DROP TRIGGER IF EXISTS trg_check_supplier_delete ON suppliers;
CREATE TRIGGER trg_check_supplier_delete
  BEFORE DELETE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION check_supplier_deletable();

-- ============================================================
-- 5. ADD PERFORMANCE INDEXES
-- ============================================================

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_suppliers_search 
  ON suppliers(name, company_name, phone);

-- Index for active suppliers lookup
CREATE INDEX IF NOT EXISTS idx_suppliers_active 
  ON suppliers(status) 
  WHERE status = 'active';

-- Index for purchase order lookups
CREATE INDEX IF NOT EXISTS idx_po_supplier_status 
  ON purchase_orders(supplier_id, status);

-- ============================================================
-- 6. CREATE SUPPLIER DEDUPLICATION VIEW
-- ============================================================

CREATE OR REPLACE VIEW supplier_duplicates_check AS
SELECT 
  s1.id as supplier1_id,
  s1.name as supplier1_name,
  s1.email as supplier1_email,
  s1.phone as supplier1_phone,
  s2.id as supplier2_id,
  s2.name as supplier2_name,
  s2.email as supplier2_email,
  s2.phone as supplier2_phone,
  CASE 
    WHEN s1.email IS NOT NULL AND s1.email = s2.email THEN 'duplicate_email'
    WHEN s1.phone IS NOT NULL AND s1.phone = s2.phone THEN 'duplicate_phone'
    WHEN LOWER(REGEXP_REPLACE(s1.name, '[^a-z0-9]', '', 'g')) = 
         LOWER(REGEXP_REPLACE(s2.name, '[^a-z0-9]', '', 'g')) THEN 'duplicate_name'
  END as duplicate_type
FROM suppliers s1
JOIN suppliers s2 ON s1.id < s2.id
WHERE (s1.email IS NOT NULL AND s1.email = s2.email)
   OR (s1.phone IS NOT NULL AND s1.phone = s2.phone)
   OR (LOWER(REGEXP_REPLACE(s1.name, '[^a-z0-9]', '', 'g')) = 
       LOWER(REGEXP_REPLACE(s2.name, '[^a-z0-9]', '', 'g')));

-- ============================================================
-- 7. UPDATE SUPPLIER PERFORMANCE VIEW
-- ============================================================

DROP VIEW IF EXISTS supplier_performance CASCADE;

CREATE OR REPLACE VIEW supplier_performance AS
SELECT
  s.id,
  s.name,
  s.company_name,
  s.code,
  s.email,
  s.phone,
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
  COALESCE(SUM(po.total_amount), 0) AS total_purchase_value,
  MAX(po.created_at) AS last_order_date,
  s.created_at
FROM suppliers s
LEFT JOIN supplier_products sp ON sp.supplier_id = s.id
LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status != 'cancelled'
GROUP BY s.id;

-- ============================================================
-- 8. INVENTORY SYNC VERIFICATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION verify_supplier_inventory_sync(supplier_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  supplier_qty INTEGER,
  inventory_qty INTEGER,
  synced BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(SUM(poi.received_qty), 0)::INTEGER as supplier_qty,
    COALESCE(p.stock, 0)::INTEGER as inventory_qty,
    COALESCE(SUM(poi.received_qty), 0) = COALESCE(p.stock, 0) as synced
  FROM products p
  JOIN purchase_order_items poi ON poi.product_id = p.id
  JOIN purchase_orders po ON po.id = poi.purchase_order_id
  WHERE po.supplier_id = verify_supplier_inventory_sync.supplier_id
  GROUP BY p.id, p.name, p.stock;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE
-- ============================================================
