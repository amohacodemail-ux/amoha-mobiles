-- Phase 8: WhatsApp Webhooks - Adding granular delivery status tracking
-- We are not modifying the existing status constraint to avoid breaking existing semantics unnecessarily.
-- Instead, we add new columns specifically for WhatsApp webhook metadata.

ALTER TABLE stock_notification_logs
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS error_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS error_title VARCHAR(255);
