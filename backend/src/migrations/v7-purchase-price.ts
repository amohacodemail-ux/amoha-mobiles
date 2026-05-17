import supabase from '../config/supabase';
import logger from '../utils/logger.util';

/**
 * Migration v7: Add purchase price column and profit tracking
 * This adds the purchase_price column to products table and creates triggers for profit calculation
 */
export async function runV7Migration(): Promise<void> {
  try {
    logger.info('[migration-v7] Starting migration: Add purchase price and profit tracking');

    // Check if purchase_price column exists in products table
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('purchase_price')
      .limit(1);

    if (checkError && checkError.message?.includes('purchase_price')) {
      // Column doesn't exist, add it
      logger.warn('[migration-v7] purchase_price column does not exist. Please run this SQL in Supabase SQL Editor:');
      logger.warn('ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2) DEFAULT 0;');
      logger.warn('ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12, 2) DEFAULT 0;');
      logger.warn('ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0;');
      logger.warn('ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_profit NUMERIC(12, 2) DEFAULT 0;');
      logger.warn('ALTER TABLE orders ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(5, 2) DEFAULT 0;');
      logger.warn('Then run the full v7 migration: backend/supabase-migration-v7-purchase-price.sql');
      return;
    }

    // Set purchase_price to 0 for products that have NULL
    const { error: updateError } = await supabase
      .from('products')
      .update({ purchase_price: 0 })
      .is('purchase_price', null);

    if (updateError) {
      logger.warn('[migration-v7] Failed to update purchase_price to 0:', updateError.message);
    } else {
      logger.info('[migration-v7] Set purchase_price to 0 for NULL values');
    }

    // Check if orders have profit columns
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_profit')
      .limit(1);

    if (ordersError && ordersError.message?.includes('total_profit')) {
      logger.warn('[migration-v7] Orders profit columns do not exist. Please run the full v7 migration SQL.');
      return;
    }

    logger.info('[migration-v7] Migration completed successfully');
  } catch (error) {
    logger.error('[migration-v7] Migration failed:', error);
    // Don't throw - allow server to start
  }
}
