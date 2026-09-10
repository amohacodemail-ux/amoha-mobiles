import supabase from '../config/supabase';
import logger from '../utils/logger.util';

export async function runV13Migration(): Promise<void> {
  try {
    logger.info('[migration-v13] Starting migration: Ensure assigned_to exists in service_requests');

    // Simple test query to check if new columns exist
    const { error: testError } = await supabase
      .from('service_requests')
      .select('assigned_to')
      .limit(1);

    if (testError && (testError.message?.includes('assigned_to') || testError.message?.toLowerCase().includes('column') || testError.message?.includes('relationship'))) {
      logger.error('[migration-v13] assigned_to column does not exist or schema cache is stale. Please run this SQL in Supabase SQL Editor:');
      logger.error(`
        -- Add assigned_to field
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
        
        -- Update the status check constraint to include 'new_request' and 'accepted'
        ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
        ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check CHECK (status IN ('new_request', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'));
        
        -- Update existing records
        UPDATE service_requests SET status = 'new_request' WHERE status = 'pending';
      `);
      return;
    }

    logger.info('[migration-v13] service_requests assigned_to schema is OK');
  } catch (error) {
    logger.error('[migration-v13] Migration failed:', error);
  }
}
