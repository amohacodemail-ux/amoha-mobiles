-- ============================================================
-- Migration: Add missing columns to purchase_orders
-- ============================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
