-- Migration: V16 Payment Transactions
-- Creates the payment_transactions table for tracking Razorpay payments and refunds.

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','success','failed','refunded','partially_refunded')),
  refund_id VARCHAR(100),
  refund_amount DECIMAL(10,2),
  refund_status VARCHAR(30),
  refund_date TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on razorpay_payment_id to ensure idempotency.
-- It's nullable because initially an order might be created without a payment ID.
CREATE UNIQUE INDEX idx_payment_transactions_rzp_payment_id ON payment_transactions(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_rzp_order ON payment_transactions(razorpay_order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER trg_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
