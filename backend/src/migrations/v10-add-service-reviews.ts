import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v10: Add support for service reviews
 * Ensures review_type and service_request_id columns exist
 */
export async function runV10Migration(): Promise<void> {
  try {
    logger.info('[migration-v10] Starting migration: Ensure service reviews support exists');

    // Simple test query to check if review_type exists
    const { error: testError } = await supabase
      .from('reviews')
      .select('review_type, service_request_id')
      .limit(1);

    if (testError && testError.message?.includes('review_type')) {
      logger.error('[migration-v10] Columns for service reviews do not exist. Please run this SQL in Supabase SQL Editor:');
      logger.error(`
        -- 1. Add new columns
        ALTER TABLE reviews ADD COLUMN review_type VARCHAR(50) NOT NULL DEFAULT 'product';
        ALTER TABLE reviews ADD COLUMN service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE;
        
        -- 2. Make product_id nullable
        ALTER TABLE reviews ALTER COLUMN product_id DROP NOT NULL;
        
        -- 3. Add constraint to ensure either product or service is provided
        ALTER TABLE reviews ADD CONSTRAINT chk_review_target 
          CHECK (
            (review_type = 'product' AND product_id IS NOT NULL AND service_request_id IS NULL) OR 
            (review_type = 'service' AND service_request_id IS NOT NULL AND product_id IS NULL)
          );
          
        -- 4. Add unique constraint to prevent multiple reviews for the same service request by same user
        ALTER TABLE reviews ADD CONSTRAINT uq_user_service_request UNIQUE (user_id, service_request_id);
      `);
      return;
    }

    logger.info('[migration-v10] Service reviews schema is OK');
  } catch (error) {
    logger.error('[migration-v10] Migration failed:', error);
  }
}
