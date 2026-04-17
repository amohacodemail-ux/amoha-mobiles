-- ============================================================
-- ALTER TABLE: Add missing columns to match service code
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. categories: Add parent_id and sort_order
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. contact_messages: Add status and admin_notes
ALTER TABLE contact_messages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'new';
ALTER TABLE contact_messages ADD COLUMN admin_notes TEXT DEFAULT '';

-- 3. notifications: Add user_id (nullable for system-wide notifications)
ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES users(id);

-- 4. product_views: Make user_id nullable, add session_id and source
ALTER TABLE product_views ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE product_views ADD COLUMN session_id VARCHAR(100);
ALTER TABLE product_views ADD COLUMN source VARCHAR(50);

-- 5. return_request_items: Add order_item_id, make product_id and price nullable
ALTER TABLE return_request_items ADD COLUMN order_item_id UUID;
ALTER TABLE return_request_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE return_request_items ALTER COLUMN price DROP NOT NULL;
ALTER TABLE return_request_items ALTER COLUMN price SET DEFAULT 0;

-- 6. coupons: Add valid_from
ALTER TABLE coupons ADD COLUMN valid_from TIMESTAMPTZ;

-- 7. activity_logs: Make user_id and details nullable
ALTER TABLE activity_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN details DROP NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN details SET DEFAULT '';
