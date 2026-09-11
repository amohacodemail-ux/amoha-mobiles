import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v14: Add Razorpay payment fields to service_requests
 */
export async function run() {
  try {
    logger.info('[migration-v14] Starting migration: Add Razorpay fields to service_requests');

    // Supabase JS doesn't support schema alteration natively.
    // We assume the exec_sql RPC exists, as seen in other migrations.
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql_string: `
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
      `
    });

    if (alterError) {
      logger.error('[migration-v14] Error adding columns. Ensure you run this manually if RPC fails:', alterError.message);
    } else {
      logger.info('[migration-v14] service_requests schema is OK');
    }
    
    return true;
  } catch (error) {
    logger.error('[migration-v14] Migration failed:', error);
    return false;
  }
}
