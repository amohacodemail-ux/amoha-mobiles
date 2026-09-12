-- Phase 2: Stock Notification Subscriptions

CREATE TABLE IF NOT EXISTS stock_notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Store phone for guest users; if user_id is provided, phone can be NULL and fetched from users table
    phone VARCHAR(20),
    
    -- WhatsApp consent for this specific notification
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
    
    -- Subscription status: active (waiting for stock), notified (alert sent), cancelled (user opted out before restock)
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'notified', 'cancelled')),
        
    -- Track the actual delivery status of the notification when it happens
    notification_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (notification_status IN ('pending', 'sent', 'failed')),
        
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure at least user_id or phone is provided
    CONSTRAINT check_stock_notif_contact CHECK (user_id IS NOT NULL OR phone IS NOT NULL)
);

-- Unique constraint for logged-in users: only one active subscription per product
CREATE UNIQUE INDEX idx_stock_notif_user_product_active 
ON stock_notification_subscriptions(user_id, product_id) 
WHERE status = 'active' AND user_id IS NOT NULL;

-- Unique constraint for guest users (by phone): only one active subscription per product
CREATE UNIQUE INDEX idx_stock_notif_phone_product_active 
ON stock_notification_subscriptions(phone, product_id) 
WHERE status = 'active' AND phone IS NOT NULL;

-- Indexes for fast querying when stock changes
CREATE INDEX idx_stock_notif_product_status ON stock_notification_subscriptions(product_id, status);
CREATE INDEX idx_stock_notif_user ON stock_notification_subscriptions(user_id);
