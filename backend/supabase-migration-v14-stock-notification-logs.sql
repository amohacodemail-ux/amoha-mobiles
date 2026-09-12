-- Phase 6: Stock Notification Tracking Logs

CREATE TABLE IF NOT EXISTS stock_notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Using the inventory_audit_log ID to track the specific stock event
    stock_event_reference UUID REFERENCES inventory_audit_log(id) ON DELETE SET NULL,
    
    message_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to quickly find logs per user/product
CREATE INDEX idx_stock_notif_logs_user_prod ON stock_notification_logs(user_id, product_id);

-- Unique constraint to prevent duplicate sends for the SAME stock event. 
-- Only one 'sent' or 'pending' log per user + product + stock event.
CREATE UNIQUE INDEX idx_stock_notif_logs_duplicate_prevention 
ON stock_notification_logs(user_id, product_id, stock_event_reference) 
WHERE status IN ('sent', 'pending');
