-- Migration v8: Ensure is_active column exists and products are active
-- This ensures the is_active column exists in the products table and sets all products to active by default

-- Check if is_active column exists in products table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column to products table';
    ELSE
        RAISE NOTICE 'is_active column already exists in products table';
    END IF;
END $$;

-- Set all products to active (in case any were set to false)
UPDATE products
SET is_active = true
WHERE is_active = false;

-- Create index on is_active for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_products_active'
    ) THEN
        CREATE INDEX idx_products_active ON products(is_active);
        RAISE NOTICE 'Created index idx_products_active';
    ELSE
        RAISE NOTICE 'Index idx_products_active already exists';
    END IF;
END $$;

-- Backfill: Set specific products to active
UPDATE products
SET is_active = true
WHERE name ILIKE '%REDMI9%' OR name ILIKE '%Samsung M30%';

-- Verify the update
SELECT id, name, is_active, stock
FROM products
WHERE name ILIKE '%REDMI9%' OR name ILIKE '%Samsung M30%';
