import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v9: Ensure service_requests table works correctly
 * Tests the table exists and logs schema info
 */
export async function runV9Migration(): Promise<void> {
  try {
    logger.info('[migration-v9] Checking service_requests table...');

    // Simple read test to verify table exists
    const { error } = await supabase
      .from('service_requests')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('[migration-v9] service_requests table error:', error.message);
      logger.error('[migration-v9] Please run supabase-migration.sql in Supabase SQL Editor');
      return;
    }

    logger.info('[migration-v9] service_requests table OK');
  } catch (error) {
    logger.error('[migration-v9] Migration failed:', error);
  }
}
