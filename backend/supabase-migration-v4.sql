-- ============================================================
-- AMOHA Mobiles – V4 Migration: Hard delete support for products
-- Purpose: Allow products to be permanently deleted even when they
--          are referenced by past orders, returns, purchase orders,
--          inventory movements, audit logs, and supplier entries.
--          Order history is preserved because order_items already
--          stores product_name and product_image as snapshot columns.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ============================================
-- Helper: drop FK on a column (safe/idempotent)
-- ============================================
CREATE OR REPLACE FUNCTION _tmp_drop_fk(_tbl TEXT, _col TEXT) RETURNS void AS $$
DECLARE con_name TEXT;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = _tbl::regclass
    AND c.contype = 'f'
    AND a.attname = _col
  LIMIT 1;
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', _tbl, con_name);
  END IF;
END $$ LANGUAGE plpgsql;

-- ============================================
-- 1. order_items.product_id → nullable, ON DELETE SET NULL
-- ============================================
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('order_items', 'product_id');
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- 2. return_request_items.product_id → nullable, ON DELETE SET NULL
-- ============================================
ALTER TABLE return_request_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('return_request_items', 'product_id');
ALTER TABLE return_request_items
  ADD CONSTRAINT fk_return_request_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- 3. purchase_order_items.product_id → nullable, ON DELETE SET NULL
-- ============================================
ALTER TABLE purchase_order_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('purchase_order_items', 'product_id');
ALTER TABLE purchase_order_items
  ADD CONSTRAINT fk_purchase_order_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- 4. inventory_movements.product_id → nullable, ON DELETE SET NULL
-- ============================================
ALTER TABLE inventory_movements ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('inventory_movements', 'product_id');
ALTER TABLE inventory_movements
  ADD CONSTRAINT fk_inventory_movements_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- 5. inventory_audit_log.product_id → nullable, ON DELETE SET NULL
-- ============================================
ALTER TABLE inventory_audit_log ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('inventory_audit_log', 'product_id');
ALTER TABLE inventory_audit_log
  ADD CONSTRAINT fk_inventory_audit_log_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- 6. supplier_entries.converted_product_id → ON DELETE SET NULL
--    (already nullable from schema; just fix the FK action)
-- ============================================
SELECT _tmp_drop_fk('supplier_entries', 'converted_product_id');
ALTER TABLE supplier_entries
  ADD CONSTRAINT fk_supplier_entries_product
  FOREIGN KEY (converted_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================
-- Cleanup temp function
-- ============================================
DROP FUNCTION _tmp_drop_fk(TEXT, TEXT);

-- ============================================
-- Verification: all product FK columns should be nullable + SET NULL
-- ============================================
SELECT
  tc.table_name,
  kcu.column_name,
  c.is_nullable,
  CASE pc.confdeltype
    WHEN 'n' THEN 'SET NULL'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
  END as on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.columns c
  ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name AND c.table_schema = 'public'
JOIN pg_constraint pc
  ON pc.conname = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('product_id', 'converted_product_id')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
