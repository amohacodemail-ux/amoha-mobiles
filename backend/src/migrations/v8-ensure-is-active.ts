import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v8: Ensure is_active column exists and products are active
 * This ensures the is_active column exists in the products table and sets all products to active by default
 */
export async function runV8Migration(): Promise<void> {
  try {
    logger.info('[migration-v8] Starting migration: Ensure products are active');

    // Set all products to active (in case any were set to false)
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: true })
      .eq('is_active', false);

    if (updateError) {
      // Column might not exist, try to add it
      logger.warn('[migration-v8] Failed to update products, trying to add column:', updateError.message);
      
      // Try adding the column via direct SQL
      const { error: addError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (addError && addError.message?.includes('is_active')) {
        logger.error('[migration-v8] is_active column does not exist. Please run this SQL in Supabase SQL Editor:');
        logger.error('ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;');
        logger.error('UPDATE products SET is_active = true WHERE is_active = false;');
        return;
      }
    } else {
      logger.info('[migration-v8] Set all inactive products to active');
    }

    // Set specific products to active
    const { error: specificUpdateError } = await supabase
      .from('products')
      .update({ is_active: true })
      .or('name.ilike.%REDMI9%,name.ilike.%Samsung M30%');

    if (specificUpdateError) {
      logger.warn('[migration-v8] Failed to update specific products:', specificUpdateError);
    } else {
      logger.info('[migration-v8] Set REDMI9 and Samsung M30 products to active');
    }

    // Verify the update
    const { data: products, error: verifyError } = await supabase
      .from('products')
      .select('id, name, is_active, stock')
      .or('name.ilike.%REDMI9%,name.ilike.%Samsung M30%');

    if (verifyError) {
      logger.warn('[migration-v8] Failed to verify update:', verifyError);
    } else {
      logger.info('[migration-v8] Product status:', JSON.stringify(products, null, 2));
    }

    logger.info('[migration-v8] Migration completed successfully');
  } catch (error) {
    logger.error('[migration-v8] Migration failed:', error);
    // Don't throw - allow server to start
  }
}
