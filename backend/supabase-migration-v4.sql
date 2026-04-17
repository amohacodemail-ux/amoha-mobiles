-- ============================================================
-- AMOHA Mobiles – V4 Migration: Hard delete support for products
-- Purpose: Allow products to be permanently deleted even when they
--          are referenced by past orders. Order history is preserved
--          because order_items already stores product_name and
--          product_image as snapshot columns.
-- Run in Supabase SQL Editor or via run-migration.js
-- ============================================================

-- Step 1: Drop the existing NOT NULL constraint and FK on order_items.product_id
ALTER TABLE order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Step 2: Drop old FK constraint (name may vary – use a safe DO block)
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'order_items'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[(
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'order_items'::regclass AND attname = 'product_id'
    )]::smallint[];
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE order_items DROP CONSTRAINT ' || quote_ident(con_name);
  END IF;
END $$;

-- Step 3: Re-add FK with ON DELETE SET NULL so deleting a product
--         automatically nullifies order_items.product_id (name/image
--         snapshot columns preserve the order history display)
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
