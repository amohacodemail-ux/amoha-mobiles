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
    return transformRow(data);
  }

  async bulkGenerateBarcodes(productIds: string[]) {
    const results = [];
    for (const id of productIds) {
      const barcode = generateBarcode();
      const { data, error } = await supabase
        .from('products').update({ barcode }).eq('id', id).select('id, name, sku, barcode').single();
      if (data) results.push(transformRow(data));
    }
    return results;
  }

  // Controller aliases
  async lookupByBarcode(barcode: string) { return this.getProductByBarcode(barcode); }
  async regenerateBarcode(productId: string) { return this.generateBarcode(productId); }
  async bulkLookup(barcodes: string[]) {
    const results = [];
    for (const bc of barcodes) {
      try { results.push(await this.getProductByBarcode(bc)); } catch { /* skip not found */ }
    }
    return results;
  }
  async getStockByBarcode(barcode: string) {
    const product = await this.getProductByBarcode(barcode);
    return { product, stock: product.stock };
  }
}

export default new BarcodeService();
