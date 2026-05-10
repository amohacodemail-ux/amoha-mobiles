import { Request, Response, NextFunction } from 'express';
import barcodeService from '../services/barcode.service';
import { BarcodeType } from '../utils/barcode.util';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';
import logger from '../utils/logger.util';

class BarcodeController {
  /** Lookup product by barcode or SKU */
  async lookup(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      if (!code) return sendMessage(res, 'Barcode or SKU is required', 400);
      const product = await barcodeService.lookupByBarcode(code);
      sendSuccess(res, product, 'Product found');
    } catch (error) {
      next(error);
    }
  }

  /** Stock check by barcode scan */
  async stockCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      if (!code) return sendMessage(res, 'Barcode or SKU is required', 400);
      const stock = await barcodeService.getStockByBarcode(code);
      sendSuccess(res, stock, 'Stock info fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Bulk lookup */
  async bulkLookup(req: Request, res: Response, next: NextFunction) {
    try {
      const { codes } = req.body;
      if (!codes || !Array.isArray(codes)) return sendMessage(res, 'codes array is required', 400);
      const products = await barcodeService.bulkLookup(codes);
      sendSuccess(res, products, 'Products found');
    } catch (error) {
      next(error);
    }
  }

  /** Regenerate barcode for a product */
  async regenerate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { type, value, prefix } = req.body;

      const options = {
        type: type as BarcodeType | undefined,
        value: value as string | undefined,
        prefix: prefix as string | undefined,
      };

      const product = await barcodeService.regenerateBarcode(productId, options);
      sendSuccess(res, product, value ? 'Barcode updated' : 'Barcode regenerated');
    } catch (error) {
      logger.error('[BarcodeController] Error regenerating barcode:', error);
      next(error);
    }
  }

  /** Validate barcode format and check for duplicates */
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { barcode, type, excludeProductId } = req.body;

      if (!barcode || typeof barcode !== 'string') {
        return sendMessage(res, 'Barcode is required', 400);
      }

      const result = await barcodeService.validateBarcode(
        barcode.trim(),
        type as BarcodeType | undefined,
        excludeProductId as string | undefined
      );

      sendSuccess(res, result, result.valid ? 'Valid barcode' : 'Invalid barcode');
    } catch (error) {
      logger.error('[BarcodeController] Error validating barcode:', error);
      next(error);
    }
  }

  /** Get available barcode types */
  async getTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = barcodeService.getBarcodeTypes();
      sendSuccess(res, types, 'Barcode types fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Migrate all product barcodes to CODE128 using SKU as barcode value */
  async migrateToCode128(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { default: supabase } = await import('../config/supabase');
      const { data: products, error } = await supabase
        .from('products')
        .select('id, sku, barcode, barcode_type')
        .not('sku', 'is', null);
      if (error) throw error;

      let updated = 0, skipped = 0, failed = 0;
      for (const p of products || []) {
        if (!p.sku) { skipped++; continue; }
        const { error: upErr } = await supabase
          .from('products')
          .update({ barcode: p.sku, barcode_type: 'CODE128', updated_at: new Date().toISOString() })
          .eq('id', p.id);
        if (upErr) { logger.error(`[BarcodeController] migrate failed for ${p.id}:`, upErr); failed++; }
        else updated++;
      }
      sendSuccess(res, { updated, skipped, failed, total: (products || []).length }, 'Migration to CODE128 complete');
    } catch (error) {
      logger.error('[BarcodeController] Error migrating to CODE128:', error);
      next(error);
    }
  }

  /** Bulk generate barcodes for multiple products */
  async bulkGenerate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productIds, type } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return sendMessage(res, 'productIds array is required', 400);
      }

      if (productIds.length > 100) {
        return sendMessage(res, 'Maximum 100 products at a time', 400);
      }

      const results = await barcodeService.bulkGenerateBarcodes(
        productIds,
        type as BarcodeType || 'EAN13'
      );

      const successCount = results.filter(r => r !== null).length;
      const failCount = results.length - successCount;

      sendSuccess(res, {
        results,
        summary: {
          total: productIds.length,
          success: successCount,
          failed: failCount,
        },
      }, `Generated barcodes: ${successCount} success, ${failCount} failed`);
    } catch (error) {
      logger.error('[BarcodeController] Error bulk generating barcodes:', error);
      next(error);
    }
  }
}

export default new BarcodeController();
