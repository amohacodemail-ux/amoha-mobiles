import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import {
  BarcodeType,
  generateProductBarcode,
  validateBarcode,
  isBarcodeExists,
  detectBarcodeType,
  formatBarcodeForDisplay,
  getBarcodeRequirements,
  bulkGenerateBarcodes as utilBulkGenerate,
} from '../utils/barcode.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

export interface BarcodeValidationResult {
  valid: boolean;
  type?: BarcodeType;
  error?: string;
  formatted?: string;
  requirements?: {
    length: string;
    charset: string;
    example: string;
  };
}

export interface BarcodeGenerateOptions {
  type?: BarcodeType;
  value?: string;
  prefix?: string;
}

class BarcodeService {
  /**
   * Generate and assign a barcode to a product
   * With duplicate prevention and type selection
   */
  async generateBarcode(
    productId: string,
    options: BarcodeGenerateOptions = {}
  ): Promise<{ id: string; name: string; sku: string; barcode: string; barcodeType: BarcodeType }> {
    // Check if product exists
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, name, sku, barcode')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError) {
      logger.error(`[BarcodeService] Error fetching product ${productId}:`, fetchError);
      throw fetchError;
    }

    if (!product) {
      throw new NotFoundError('Product');
    }

    // If custom value provided, validate it
    if (options.value) {
      const type = options.type || detectBarcodeType(options.value) || 'CODE128';
      const validation = validateBarcode(options.value, type);

      if (!validation.valid) {
        throw new BadRequestError(validation.error || 'Invalid barcode format');
      }

      // Check for duplicates (excluding current product)
      const exists = await isBarcodeExists(options.value, productId);
      if (exists) {
        throw new BadRequestError('Barcode already exists in database');
      }

      // Update product with custom barcode
      const { data, error } = await supabase
        .from('products')
        .update({
          barcode: options.value,
          barcode_type: type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select('id, name, sku, barcode, barcode_type')
        .single();

      if (error) {
        logger.error(`[BarcodeService] Error updating product ${productId} with custom barcode:`, error);
        throw error;
      }

      const transformed = transformRow(data);
      return {
        id: transformed._id || transformed.id,
        name: transformed.name,
        sku: transformed.sku,
        barcode: transformed.barcode,
        barcodeType: transformed.barcodeType || type,
      };
    }

    // Generate new unique barcode
    const type = options.type || 'EAN13';
    let barcode: string;

    try {
      const result = await generateProductBarcode({ type, prefix: options.prefix });
      barcode = result.barcode;
    } catch (err: any) {
      logger.error(`[BarcodeService] Error generating barcode for product ${productId}:`, err);
      throw new BadRequestError(err.message || 'Failed to generate unique barcode');
    }

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update({
        barcode,
        barcode_type: type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('id, name, sku, barcode, barcode_type')
      .single();

    if (error) {
      // Handle unique constraint violation
      if ((error as any).code === '23505') {
        throw new BadRequestError('Barcode already exists (duplicate)');
      }
      logger.error(`[BarcodeService] Error assigning barcode to product ${productId}:`, error);
      throw error;
    }

    const transformed = transformRow(data);
    return {
      id: transformed._id || transformed.id,
      name: transformed.name,
      sku: transformed.sku,
      barcode: transformed.barcode,
      barcodeType: transformed.barcodeType || type,
    };
  }

  /**
   * Validate barcode format and check for duplicates
   */
  async validateBarcode(
    barcode: string,
    type?: BarcodeType,
    excludeProductId?: string
  ): Promise<BarcodeValidationResult> {
    const detectedType = type || detectBarcodeType(barcode);

    if (!detectedType) {
      return {
        valid: false,
        error: 'Unable to detect barcode format. Please specify the barcode type.',
      };
    }

    // Validate format
    const validation = validateBarcode(barcode, detectedType);

    if (!validation.valid) {
      return {
        valid: false,
        type: detectedType,
        error: validation.error,
        requirements: getBarcodeRequirements(detectedType),
      };
    }

    // Check for duplicates
    const exists = await isBarcodeExists(barcode, excludeProductId);

    if (exists) {
      return {
        valid: false,
        type: detectedType,
        error: 'Barcode already exists in database',
        formatted: formatBarcodeForDisplay(barcode, detectedType),
        requirements: getBarcodeRequirements(detectedType),
      };
    }

    return {
      valid: true,
      type: detectedType,
      formatted: formatBarcodeForDisplay(barcode, detectedType),
      requirements: getBarcodeRequirements(detectedType),
    };
  }

  /**
   * Get product by barcode (or SKU as fallback)
   */
  async getProductByBarcode(barcode: string) {
    // 1. Exact barcode match
    const { data: byBarcode, error: e1 } = await supabase
      .from('products')
      .select('*, categories(id, name, slug), brands(id, name, slug)')
      .eq('barcode', barcode)
      .maybeSingle();

    if (e1) {
      logger.error('[BarcodeService] Error looking up by barcode:', e1);
      throw e1;
    }

    if (byBarcode) {
      return transformRow(byBarcode);
    }

    // 2. Fallback: SKU match - scanner may have scanned SKU-based label
    const { data: bySku, error: e2 } = await supabase
      .from('products')
      .select('*, categories(id, name, slug), brands(id, name, slug)')
      .eq('sku', barcode)
      .maybeSingle();

    if (e2) {
      logger.error('[BarcodeService] Error looking up by SKU:', e2);
      throw e2;
    }

    if (bySku) {
      return transformRow(bySku);
    }

    throw new NotFoundError('Product');
  }

  /**
   * Bulk generate barcodes for multiple products
   */
  async bulkGenerateBarcodes(
    productIds: string[],
    type: BarcodeType = 'EAN13'
  ): Promise<Array<{ id: string; name: string; sku: string; barcode: string; barcodeType: BarcodeType } | null>> {
    // Generate unique barcodes first
    const barcodes = await utilBulkGenerate(productIds.length, type);

    // Assign to products
    const results = await Promise.all(
      productIds.map(async (id, index) => {
        try {
          const barcode = barcodes[index];

          const { data, error } = await supabase
            .from('products')
            .update({
              barcode,
              barcode_type: type,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('id, name, sku, barcode, barcode_type')
            .single();

          if (error) {
            logger.error(`[BarcodeService] Error assigning barcode to product ${id}:`, error);
            return null;
          }

          const transformed = transformRow(data);
          return {
            id: transformed._id || transformed.id,
            name: transformed.name,
            sku: transformed.sku,
            barcode: transformed.barcode,
            barcodeType: transformed.barcodeType || type,
          };
        } catch (err) {
          logger.error(`[BarcodeService] Error processing product ${id}:`, err);
          return null;
        }
      })
    );

    return results;
  }

  /**
   * Bulk lookup products by barcodes
   */
  async bulkLookup(barcodes: string[]) {
    if (barcodes.length === 0) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug), brands(id, name, slug)')
      .in('barcode', barcodes);

    if (error) {
      logger.error('[BarcodeService] Error in bulk lookup:', error);
      throw error;
    }

    return (data || []).map(transformRow);
  }

  /**
   * Get all available barcode types and their requirements
   */
  getBarcodeTypes(): Array<{
    type: BarcodeType;
    name: string;
    description: string;
    requirements: { length: string; charset: string; example: string };
  }> {
    const types: BarcodeType[] = ['EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39'];

    return types.map((type) => ({
      type,
      name: this.getBarcodeTypeName(type),
      description: this.getBarcodeTypeDescription(type),
      requirements: getBarcodeRequirements(type),
    }));
  }

  private getBarcodeTypeName(type: BarcodeType): string {
    const names: Record<BarcodeType, string> = {
      EAN13: 'EAN-13 (Retail)',
      EAN8: 'EAN-8 (Small Retail)',
      UPCA: 'UPC-A (North America)',
      CODE128: 'Code 128 (Alphanumeric)',
      CODE39: 'Code 39 (Industrial)',
    };
    return names[type];
  }

  private getBarcodeTypeDescription(type: BarcodeType): string {
    const descriptions: Record<BarcodeType, string> = {
      EAN13: 'Standard 13-digit retail barcode used globally. Best for retail products.',
      EAN8: 'Compact 8-digit barcode for small products.',
      UPCA: '12-digit barcode standard in North America.',
      CODE128: 'High-density alphanumeric barcode. Best for internal tracking.',
      CODE39: 'Industrial barcode supporting letters and numbers.',
    };
    return descriptions[type];
  }

  // Controller aliases
  async lookupByBarcode(barcode: string) {
    return this.getProductByBarcode(barcode);
  }

  async regenerateBarcode(productId: string, options?: BarcodeGenerateOptions) {
    return this.generateBarcode(productId, options);
  }

  async getStockByBarcode(barcode: string) {
    return this.getProductByBarcode(barcode);
  }
}

export default new BarcodeService();
