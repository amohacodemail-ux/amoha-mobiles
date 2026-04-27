import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { generateBarcode } from '../models/product.model';
import { NotFoundError } from '../errors/app-error';

class BarcodeService {
  async generateBarcode(productId: string) {
    const barcode = generateBarcode();
    const { data, error } = await supabase
      .from('products').update({ barcode }).eq('id', productId).select('id, name, sku, barcode').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Product');
    return transformRow(data);
  }

  async getProductByBarcode(barcode: string) {
    // 1. Exact barcode match (EAN-13 / Code 128 numeric value stored in DB)
    const { data: byBarcode, error: e1 } = await supabase
      .from('products').select('*').eq('barcode', barcode).maybeSingle();
    if (e1) throw e1;
    if (byBarcode) return transformRow(byBarcode);

    // 2. Fallback: SKU match — scanner may have scanned a SKU-based label
    const { data: bySku, error: e2 } = await supabase
      .from('products').select('*').eq('sku', barcode).maybeSingle();
    if (e2) throw e2;
    if (bySku) return transformRow(bySku);

    throw new NotFoundError('Product');
  }

  async bulkGenerateBarcodes(productIds: string[]) {
    // Generate all barcodes in parallel
    const results = await Promise.all(
      productIds.map(async (id) => {
        const barcode = generateBarcode();
        const { data } = await supabase
          .from('products').update({ barcode }).eq('id', id).select('id, name, sku, barcode').single();
        return data ? transformRow(data) : null;
      }),
    );
    return results.filter(Boolean);
  }

  // Controller aliases
  async lookupByBarcode(barcode: string) { return this.getProductByBarcode(barcode); }
  async regenerateBarcode(productId: string) { return this.generateBarcode(productId); }
  async bulkLookup(barcodes: string[]) {
    if (barcodes.length === 0) return [];
    // Batch lookup in a single query
    const { data } = await supabase.from('products').select('*').in('barcode', barcodes);
    return (data || []).map(transformRow);
  }
  async getStockByBarcode(barcode: string) {
    return this.getProductByBarcode(barcode);
  }
}

export default new BarcodeService();
