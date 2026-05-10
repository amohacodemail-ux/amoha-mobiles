-- ============================================================
-- AMOHA Mobiles — Barcode System Enhancement Migration
-- This migration adds barcode_type column and improves barcode indexing
-- Run this after deploying the barcode system updates
-- ============================================================

-- Add barcode_type column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(10) DEFAULT 'EAN13'
  CHECK (barcode_type IN ('EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39'));

-- Create index on barcode_type for filtering
CREATE INDEX IF NOT EXISTS idx_products_barcode_type ON products(barcode_type);

-- Create composite index for barcode + type lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode_composite ON products(barcode, barcode_type);

-- Ensure barcode column has unique constraint
-- Note: This may fail if duplicates exist. Run the cleanup below first if needed.
DO $$
BEGIN
  -- Check if unique constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_barcode_unique'
    AND conrelid = 'products'::regclass
  ) THEN
    -- Try to add unique constraint
    BEGIN
      ALTER TABLE products
      ADD CONSTRAINT products_barcode_unique UNIQUE (barcode);
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint - duplicates exist. Clean up duplicates first.';
    END;
  END IF;
END $$;

-- Function to generate EAN-13 checksum
CREATE OR REPLACE FUNCTION calculate_ean13_checksum(base12 TEXT)
RETURNS INTEGER AS $$
DECLARE
  sum_val INTEGER := 0;
  i INTEGER;
  digit INTEGER;
  checksum INTEGER;
BEGIN
  -- Validate input
  IF base12 IS NULL OR LENGTH(base12) != 12 OR base12 ~ '[^0-9]' THEN
    RETURN NULL;
  END IF;

  -- Calculate checksum
  FOR i IN 1..12 LOOP
    digit := CAST(SUBSTRING(base12 FROM i FOR 1) AS INTEGER);
    IF i % 2 = 1 THEN
      sum_val := sum_val + digit;
    ELSE
      sum_val := sum_val + (digit * 3);
    END IF;
  END LOOP;

  checksum := (10 - (sum_val % 10)) % 10;
  RETURN checksum;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate EAN-13 barcode
CREATE OR REPLACE FUNCTION is_valid_ean13(barcode TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  base12 TEXT;
  checksum INTEGER;
  actual_checksum INTEGER;
BEGIN
  IF barcode IS NULL OR LENGTH(barcode) != 13 OR barcode ~ '[^0-9]' THEN
    RETURN FALSE;
  END IF;

  base12 := SUBSTRING(barcode FROM 1 FOR 12);
  actual_checksum := CAST(SUBSTRING(barcode FROM 13 FOR 1) AS INTEGER);
  checksum := calculate_ean13_checksum(base12);

  RETURN checksum = actual_checksum;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-set barcode_type based on barcode format
CREATE OR REPLACE FUNCTION auto_detect_barcode_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if barcode_type is not explicitly set
  IF NEW.barcode_type IS NULL AND NEW.barcode IS NOT NULL THEN
    IF LENGTH(NEW.barcode) = 13 AND NEW.barcode ~ '^[0-9]+$' THEN
      NEW.barcode_type := 'EAN13';
    ELSIF LENGTH(NEW.barcode) = 8 AND NEW.barcode ~ '^[0-9]+$' THEN
      NEW.barcode_type := 'EAN8';
    ELSIF LENGTH(NEW.barcode) = 12 AND NEW.barcode ~ '^[0-9]+$' THEN
      NEW.barcode_type := 'UPCA';
    ELSE
      NEW.barcode_type := 'CODE128';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-detecting barcode type
DROP TRIGGER IF EXISTS trg_auto_barcode_type ON products;
CREATE TRIGGER trg_auto_barcode_type
  BEFORE INSERT OR UPDATE OF barcode ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_detect_barcode_type();

-- Update existing products to set barcode_type if missing
UPDATE products
SET barcode_type = CASE
  WHEN LENGTH(barcode) = 13 AND barcode ~ '^[0-9]+$' THEN 'EAN13'
  WHEN LENGTH(barcode) = 8 AND barcode ~ '^[0-9]+$' THEN 'EAN8'
  WHEN LENGTH(barcode) = 12 AND barcode ~ '^[0-9]+$' THEN 'UPCA'
  ELSE 'CODE128'
END
WHERE barcode IS NOT NULL AND barcode_type IS NULL;

-- View for products with barcode information
CREATE OR REPLACE VIEW product_barcodes AS
SELECT
  id,
  name,
  sku,
  barcode,
  barcode_type,
  is_valid_ean13(barcode) as is_valid_ean13,
  stock,
  selling_price,
  is_active,
  CASE
    WHEN barcode IS NULL THEN 'missing'
    WHEN barcode_type = 'EAN13' AND NOT is_valid_ean13(barcode) THEN 'invalid_checksum'
    ELSE 'valid'
  END as barcode_status
FROM products;

-- Function to find duplicate barcodes
CREATE OR REPLACE FUNCTION find_duplicate_barcodes()
RETURNS TABLE (
  barcode VARCHAR(20),
  count BIGINT,
  product_ids TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.barcode,
    COUNT(*)::BIGINT,
    STRING_AGG(p.id::TEXT, ', ')
  FROM products p
  WHERE p.barcode IS NOT NULL
  GROUP BY p.barcode
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Comment on columns for documentation
COMMENT ON COLUMN products.barcode IS 'Unique product barcode (EAN-13, Code 128, etc.)';
COMMENT ON COLUMN products.barcode_type IS 'Barcode format type: EAN13, EAN8, UPCA, CODE128, CODE39';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Barcode system migration completed successfully';
END $$;
