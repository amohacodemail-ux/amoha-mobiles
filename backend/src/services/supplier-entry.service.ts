import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/app-error';
import { SUPPLIER_ENTRIES_TABLE } from '../models/supplier-entry.model';
import inventoryLedger from './inventory-ledger.service';
import logger from '../utils/logger.util';

class SupplierEntryService {
  // ==================== Supplier actions ====================

  async createEntry(supplierId: string, data: { itemName: string; quantity: number; price?: number; note?: string }) {
    const { data: entry, error } = await supabase.from(SUPPLIER_ENTRIES_TABLE).insert({
      supplier_id: supplierId,
      item_name: data.itemName,
      quantity: data.quantity,
      price: data.price || null,
      note: data.note || '',
      status: 'pending',
      created_by: supplierId,
    }).select('*').single();
    if (error) throw error;
    return transformRow(entry);
  }

  async getMyEntries(supplierId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from(SUPPLIER_ENTRIES_TABLE)
      .select('*', { count: 'exact' })
      .eq('supplier_id', supplierId);

    if (query.status) qb = qb.eq('status', query.status);
    if (query.search) qb = qb.ilike('item_name', `%${query.search}%`);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      entries: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getEntryById(entryId: string) {
    const { data, error } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*').eq('id', entryId).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Supplier entry');
    return transformRow(data);
  }

  // ==================== Admin actions ====================

  async getAllEntries(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from(SUPPLIER_ENTRIES_TABLE)
      .select('*, users!supplier_entries_supplier_id_fkey(id, name, email)', { count: 'exact' });

    if (query.status) qb = qb.eq('status', query.status);
    if (query.supplierId) qb = qb.eq('supplier_id', query.supplierId);
    if (query.search) qb = qb.ilike('item_name', `%${query.search}%`);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      entries: (data || []).map((row: any) => {
        const entry = transformRow(row);
        if (row.users) {
          entry.supplier = transformRow(row.users);
          delete entry.users;
        }
        return entry;
      }),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getDashboardStats() {
    const { count: total } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: converted } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'converted');
    const { count: rejected } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'rejected');

    return {
      total: total || 0,
      pending: pending || 0,
      converted: converted || 0,
      rejected: rejected || 0,
    };
  }

  /**
   * Convert a supplier entry into a product + auto-create inventory.
   * Admin provides product details (name, price, category, brand, etc.).
   */
  async convertEntry(entryId: string, adminId: string, productData: any) {
    // 1. Fetch entry & validate
    const { data: entry, error: fetchErr } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*').eq('id', entryId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!entry) throw new NotFoundError('Supplier entry');
    if (entry.status !== 'pending') {
      throw new BadRequestError(`Entry already ${entry.status}, cannot convert`);
    }

    // 2. Create the product
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const sku = `SKU-${Date.now().toString(36).toUpperCase()}`;
    const barcode = `BAR-${Date.now().toString(36).toUpperCase()}`;

    const sellingPrice = productData.sellingPrice || productData.price || entry.price || 0;
    const originalPrice = productData.originalPrice || sellingPrice;
    const thumbnail = productData.thumbnail || productData.images?.[0] || 'https://placehold.co/400x400?text=Product';

    const productInsert: any = {
      name: productData.name,
      slug,
      sku,
      barcode,
      description: productData.description || '',
      price: sellingPrice,
      selling_price: sellingPrice,
      original_price: originalPrice,
      stock: entry.quantity,
      category_id: productData.categoryId || null,
      brand_id: productData.brandId || null,
      images: productData.images || [],
      thumbnail,
      is_active: true,
    };

    const { data: product, error: prodErr } = await supabase
      .from('products').insert(productInsert).select('*').single();
    if (prodErr) {
      logger.error('Supplier entry conversion failed during product insert:', prodErr);
      throw prodErr;
    }

    // 3. Auto-create inventory record via the ledger service
    await inventoryLedger.createFromConversion(
      product.id,
      entry.supplier_id,
      entryId,
      entry.quantity,
      entry.price || 0,
      adminId,
    );

    // 4. Mark the entry as converted
    await supabase.from(SUPPLIER_ENTRIES_TABLE).update({
      status: 'converted',
      converted_product_id: product.id,
      converted_by: adminId,
      converted_at: new Date().toISOString(),
    }).eq('id', entryId);

    logger.info(`Supplier entry ${entryId} converted to product ${product.id} by admin ${adminId}`);

    return {
      entry: transformRow({ ...entry, status: 'converted', converted_product_id: product.id }),
      product: transformRow(product),
    };
  }

  async rejectEntry(entryId: string, adminId: string, reason: string) {
    const { data: entry, error: fetchErr } = await supabase
      .from(SUPPLIER_ENTRIES_TABLE).select('*').eq('id', entryId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!entry) throw new NotFoundError('Supplier entry');
    if (entry.status !== 'pending') {
      throw new BadRequestError(`Entry already ${entry.status}, cannot reject`);
    }

    const { data: updated, error } = await supabase.from(SUPPLIER_ENTRIES_TABLE).update({
      status: 'rejected',
      rejection_reason: reason,
      rejected_by: adminId,
      rejected_at: new Date().toISOString(),
    }).eq('id', entryId).select('*').single();
    if (error) throw error;

    logger.info(`Supplier entry ${entryId} rejected by admin ${adminId}: ${reason}`);
    return transformRow(updated);
  }
}

export default new SupplierEntryService();
