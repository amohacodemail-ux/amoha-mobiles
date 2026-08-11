-- Add created_by column to orders table to track the salesperson or admin who created the order.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Optional: Create an index for faster lookups when filtering by salesperson
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
