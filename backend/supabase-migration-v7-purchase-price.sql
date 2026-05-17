-- ============================================================
-- AMOHA Mobiles – V7 Migration: Purchase Price & Profit Tracking
-- Run AFTER supabase-migration-v6.sql
-- Safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- =====================================================================
-- 1. ADD purchase_price COLUMN to products table
--    This allows calculating profit per product (selling price - purchase price)
-- =====================================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2) DEFAULT 0;

-- =====================================================================
-- 2. ADD CONSTRAINT to ensure purchase_price is non-negative
-- =====================================================================
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_purchase_price_check,
  ADD CONSTRAINT products_purchase_price_check CHECK (purchase_price >= 0);

-- =====================================================================
-- 3. BACKFILL: Set default purchase_price to 0 for existing products
-- =====================================================================
UPDATE products
SET purchase_price = 0
WHERE purchase_price IS NULL;

-- =====================================================================
-- 4. ADD COLUMN to track total_revenue in orders table
--    (for cumulative revenue calculation in dashboard)
-- =====================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12, 2) DEFAULT 0;

-- =====================================================================
-- 5. ADD COLUMN to track total_cost in orders table
--    (for cumulative profit calculation in dashboard)
-- =====================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0;

-- =====================================================================
-- 6. ADD COLUMN to track total_profit in orders table
--    (revenue - cost)
-- =====================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total_profit NUMERIC(12, 2) DEFAULT 0;

-- =====================================================================
-- 7. ADD COLUMN to track profit_margin in orders table
--    (percentage)
-- =====================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(5, 2) DEFAULT 0;

-- =====================================================================
-- 8. BACKFILL: Calculate revenue/cost/profit for existing orders
-- =====================================================================
UPDATE orders o
SET 
  total_revenue = COALESCE(o.total, 0),
  total_cost = (
    SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = o.id
  ),
  total_profit = COALESCE(o.total, 0) - (
    SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = o.id
  ),
  profit_margin = CASE 
    WHEN (
      SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = o.id
    ) > 0 THEN
      ROUND(((COALESCE(o.total, 0) - (
        SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
      )) / (
        SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
      )) * 100, 2)
    ELSE 0
  END
WHERE total_revenue IS NULL OR total_cost IS NULL;

-- =====================================================================
-- 9. FUNCTION: Auto-calculate order profit metrics on order creation/update
-- =====================================================================
CREATE OR REPLACE FUNCTION calculate_order_profit_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost NUMERIC(12, 2);
  v_total_revenue NUMERIC(12, 2);
  v_total_profit NUMERIC(12, 2);
  v_profit_margin NUMERIC(5, 2);
BEGIN
  -- Calculate total cost (sum of purchase price * quantity for all items)
  SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
  INTO v_total_cost
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id;

  -- Total revenue is the order total
  v_total_revenue := COALESCE(NEW.total, 0);

  -- Calculate profit
  v_total_profit := v_total_revenue - v_total_cost;

  -- Calculate profit margin percentage
  IF v_total_cost > 0 THEN
    v_profit_margin := ROUND((v_total_profit / v_total_cost) * 100, 2);
  ELSE
    v_profit_margin := 0;
  END IF;

  -- Update the order with calculated metrics
  NEW.total_revenue := v_total_revenue;
  NEW.total_cost := v_total_cost;
  NEW.total_profit := v_total_profit;
  NEW.profit_margin := v_profit_margin;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 10. TRIGGER: Auto-calculate profit metrics on order insert/update
-- =====================================================================
DROP TRIGGER IF EXISTS trg_calculate_order_profit ON orders;
CREATE TRIGGER trg_calculate_order_profit
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_profit_metrics();

-- =====================================================================
-- 11. FUNCTION: Recalculate order profit when purchase_price changes
-- =====================================================================
CREATE OR REPLACE FUNCTION recalculate_order_profit_on_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate profit for all orders containing this product
  UPDATE orders o
  SET 
    total_cost = (
      SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = o.id
    ),
    total_profit = COALESCE(o.total, 0) - (
      SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = o.id
    ),
    profit_margin = CASE 
      WHEN (
        SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
      ) > 0 THEN
        ROUND(((COALESCE(o.total, 0) - (
          SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
        )) / (
          SELECT COALESCE(SUM(oi.quantity * COALESCE(p.purchase_price, 0)), 0)
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
        )) * 100, 2)
      ELSE 0
    END
  WHERE EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 12. TRIGGER: Recalculate order profit when product purchase_price changes
-- =====================================================================
DROP TRIGGER IF EXISTS trg_recalculate_profit_on_price_change ON products;
CREATE TRIGGER trg_recalculate_profit_on_price_change
AFTER UPDATE OF purchase_price ON products
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_profit_on_price_change();

-- =====================================================================
-- VERIFICATION QUERIES (read-only, safe to run)
-- =====================================================================

-- Check products with purchase_price
SELECT 
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE purchase_price > 0) AS products_with_purchase_price,
  COUNT(*) FILTER (WHERE purchase_price = 0) AS products_with_zero_purchase_price
FROM products;

-- Check orders with profit metrics
SELECT 
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE total_profit > 0) AS profitable_orders,
  COUNT(*) FILTER (WHERE total_profit < 0) AS loss_orders,
  COUNT(*) FILTER (WHERE total_profit = 0) AS break_even_orders,
  ROUND(SUM(total_revenue), 2) AS total_revenue,
  ROUND(SUM(total_cost), 2) AS total_cost,
  ROUND(SUM(total_profit), 2) AS total_profit
FROM orders;

-- Sample product profit calculation
SELECT 
  p.id,
  p.name,
  p.selling_price,
  p.purchase_price,
  (p.selling_price - p.purchase_price) AS profit,
  CASE 
    WHEN p.purchase_price > 0 THEN ROUND(((p.selling_price - p.purchase_price) / p.purchase_price) * 100, 2)
    ELSE 0
  END AS profit_margin_percent
FROM products p
LIMIT 10;
