-- ============================================================
-- AMOHA Mobiles – V6 Migration: Inventory Integrity & Stability
-- Run AFTER supabase-migration-v5.sql
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE)
-- ============================================================

-- =====================================================================
-- 1. FIX inventory_overview VIEW
--    DROP first to avoid "cannot change name of view column" error when
--    adding new columns or changing column order.
--    Preserves original column order; adds product_is_active at the end.
--    Removes the "p.is_active = true" filter so temporarily disabled
--    products are not silently dropped from inventory tracking.
-- =====================================================================
DROP VIEW IF EXISTS inventory_overview CASCADE;
CREATE VIEW inventory_overview AS
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
  END AS stock_status,
  p.is_active AS product_is_active
FROM inventory i
JOIN products p ON p.id = i.product_id
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id;

-- =====================================================================
-- 2. FIX low_stock_products VIEW
--    DROP first to avoid column rename error.
--    Keeps original column names; adds inventory_available_stock at end.
-- =====================================================================
DROP VIEW IF EXISTS low_stock_products CASCADE;
CREATE VIEW low_stock_products AS
SELECT
  p.id AS product_id,
  p.name,
  p.sku,
  p.stock AS total_stock,
  p.selling_price,
  b.name AS brand_name,
  c.name AS category_name,
  CASE
    WHEN COALESCE(i.available_stock, p.stock) = 0 THEN 'out_of_stock'
    WHEN COALESCE(i.available_stock, p.stock) <= 5 THEN 'critical'
    WHEN COALESCE(i.available_stock, p.stock) <= 10 THEN 'low'
    ELSE 'normal'
  END AS stock_status,
  COALESCE(i.available_stock, p.stock) AS inventory_available_stock
FROM products p
LEFT JOIN inventory i ON i.product_id = p.id
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND COALESCE(i.available_stock, p.stock) <= 10
ORDER BY COALESCE(i.available_stock, p.stock) ASC;

-- =====================================================================
-- 3. DB INTEGRITY: Prevent stock going below 0 via direct SQL
--    (application layer already guards, this is the DB safety net)
-- =====================================================================
ALTER TABLE inventory
  DROP CONSTRAINT IF EXISTS inventory_available_stock_check,
  ADD CONSTRAINT inventory_available_stock_check CHECK (available_stock >= 0);

ALTER TABLE inventory
  DROP CONSTRAINT IF EXISTS inventory_reserved_stock_check,
  ADD CONSTRAINT inventory_reserved_stock_check CHECK (reserved_stock >= 0);

ALTER TABLE inventory
  DROP CONSTRAINT IF EXISTS inventory_sold_stock_check,
  ADD CONSTRAINT inventory_sold_stock_check CHECK (sold_stock >= 0);

ALTER TABLE inventory
  DROP CONSTRAINT IF EXISTS inventory_damaged_stock_check,
  ADD CONSTRAINT inventory_damaged_stock_check CHECK (damaged_stock >= 0);

-- =====================================================================
-- 4. ORPHAN CLEANUP: Remove stock_alerts for deleted products
--    (products.stock column constraint already prevents negatives)
-- =====================================================================
DELETE FROM stock_alerts
WHERE product_id IS NOT NULL
  AND product_id NOT IN (SELECT id FROM products);

-- =====================================================================
-- 5. ORPHAN CLEANUP: Remove inventory_movements for null product_id
--    (these have no meaning after V4 ON DELETE SET NULL migration)
-- =====================================================================
DELETE FROM inventory_movements WHERE product_id IS NULL;

-- =====================================================================
-- 6. INTEGRITY CHECK: Sync products.stock with inventory.available_stock
--    For products that have inventory records but products.stock is out of sync.
--    This is a one-time reconciliation.
-- =====================================================================
UPDATE products p
SET stock = i.available_stock,
    updated_at = NOW()
FROM inventory i
WHERE i.product_id = p.id
  AND p.stock != i.available_stock;

-- =====================================================================
-- 7. DEDUP: Remove duplicate inventory_forecasts rows
--    (caused by the old onConflict:'id' bug). Keep the row with the
--    highest days_of_stock_remaining (most recent calculation) per
--    (product_id, forecast_date) pair.
-- =====================================================================
DELETE FROM inventory_forecasts
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY product_id, forecast_date
        ORDER BY created_at DESC
      ) AS rn
    FROM inventory_forecasts
  ) ranked
  WHERE rn > 1
);

-- =====================================================================
-- 8. INDEX: Improve forecast lookup performance
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_inv_forecasts_product_date
  ON inventory_forecasts(product_id, forecast_date DESC);

-- =====================================================================
-- 9. INDEX: Improve stock alert dedup query performance
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stock_alerts_dedup
  ON stock_alerts(product_id, alert_type, is_acknowledged, warehouse_id);

-- =====================================================================
-- 10. FUNCTION: auto-sync products.stock from inventory.available_stock
--    on every inventory update (keeps both tables always in sync)
-- =====================================================================
CREATE OR REPLACE FUNCTION sync_product_stock_from_inventory()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = NEW.available_stock,
      updated_at = NOW()
  WHERE id = NEW.product_id
    AND stock != NEW.available_stock;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_stock ON inventory;
CREATE TRIGGER trg_sync_product_stock
AFTER UPDATE OF available_stock ON inventory
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock_from_inventory();

-- =====================================================================
-- 11. FUNCTION: auto-create low stock alert on inventory update
-- =====================================================================
CREATE OR REPLACE FUNCTION auto_create_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_alert_type TEXT;
BEGIN
  IF NEW.available_stock > 10 THEN
    RETURN NEW;
  END IF;

  v_alert_type := CASE WHEN NEW.available_stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END;

  -- Only insert if no unacknowledged alert of this type already exists for this product (global)
  IF NOT EXISTS (
    SELECT 1 FROM stock_alerts
    WHERE product_id = NEW.product_id
      AND alert_type = v_alert_type
      AND is_acknowledged = false
      AND warehouse_id IS NULL
  ) THEN
    INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold)
    VALUES (
      NEW.product_id,
      v_alert_type,
      NEW.available_stock,
      CASE WHEN v_alert_type = 'out_of_stock' THEN 0 ELSE 10 END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_low_stock_alert ON inventory;
CREATE TRIGGER trg_auto_low_stock_alert
AFTER UPDATE OF available_stock ON inventory
FOR EACH ROW
EXECUTE FUNCTION auto_create_low_stock_alert();

-- =====================================================================
-- VERIFICATION QUERIES (read-only, safe to run)
-- =====================================================================

-- Check for products.stock vs inventory.available_stock mismatches
SELECT
  p.id,
  p.name,
  p.stock AS products_stock,
  i.available_stock AS inventory_available,
  i.reserved_stock,
  i.sold_stock
FROM products p
JOIN inventory i ON i.product_id = p.id
WHERE p.stock != i.available_stock
LIMIT 20;

-- Check for duplicate unacknowledged alerts
SELECT product_id, alert_type, COUNT(*) as cnt
FROM stock_alerts
WHERE is_acknowledged = false AND warehouse_id IS NULL
GROUP BY product_id, alert_type
HAVING COUNT(*) > 1;

-- Inventory summary
SELECT
  COUNT(*) AS total_inventory_records,
  SUM(available_stock) AS total_available,
  SUM(reserved_stock) AS total_reserved,
  SUM(sold_stock) AS total_sold,
  COUNT(*) FILTER (WHERE available_stock = 0) AS out_of_stock,
  COUNT(*) FILTER (WHERE available_stock > 0 AND available_stock <= 10) AS low_stock
FROM inventory;
