-- ============================================================
-- AMOHA Mobiles – V9 Migration: Fix Role Constraint
-- Run AFTER previous migrations
-- Updates the role CHECK constraint to include missing roles
-- ============================================================

-- =====================================================================
-- DROP the old role constraint
-- =====================================================================
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- =====================================================================
-- ADD the new role constraint with all roles
-- =====================================================================
ALTER TABLE users
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user','admin','digital_marketing','sales','marketing','purchase_inventory','logistics','purchase','supplier','service_engineer'));

-- =====================================================================
-- VERIFICATION (read-only)
-- =====================================================================

-- Check constraint exists
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
  AND conname = 'users_role_check';

-- Check current users with their roles
SELECT role, COUNT(*) as user_count 
FROM users 
GROUP BY role 
ORDER BY role;
