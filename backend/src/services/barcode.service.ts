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
    const { data, error } = await supabase.from('products').select('*').eq('barcode', barcode).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Product');
    const p = transformRow(data);
    // Normalise: frontend expects `price` to be the selling price
    if (p.sellingPrice != null) {
      p.originalPrice = p.originalPrice ?? p.price ?? p.sellingPrice;
      p.price = p.sellingPrice;
    }
    return p;
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
