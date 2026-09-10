import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v11: Add walk-in and billing fields to service_requests
 */
export async function runV11Migration(): Promise<void> {
  try {
    logger.info('[migration-v11] Starting migration: Ensure walk-in and billing fields exist in service_requests');

    // Simple test query to check if new columns exist
    const { error: testError } = await supabase
      .from('service_requests')
      .select('is_walk_in, payment_status')
      .limit(1);

    if (testError && (testError.message?.includes('is_walk_in') || testError.message?.toLowerCase().includes('column'))) {
      logger.error('[migration-v11] Columns for walk-in and billing do not exist. Please run this SQL in Supabase SQL Editor:');
      logger.error(`
        -- Add walk-in and billing fields
        ALTER TABLE service_requests 
        ADD COLUMN is_walk_in BOOLEAN DEFAULT false,
        ADD COLUMN imei_or_serial_number VARCHAR(255),
        ADD COLUMN customer_photo_url TEXT,
        ADD COLUMN device_photo_url TEXT,
        ADD COLUMN service_charges NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN parts_charges NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN total_amount NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN payment_method VARCHAR(50),
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN invoice_number VARCHAR(100),
        ADD COLUMN invoice_date TIMESTAMP WITH TIME ZONE;
      `);
      return;
    }

    logger.info('[migration-v11] service_requests schema is OK');
  } catch (error) {
    logger.error('[migration-v11] Migration failed:', error);
  }
}
