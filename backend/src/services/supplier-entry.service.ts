import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/app-error';
import { SUPPLIER_ENTRIES_TABLE } from '../models/supplier-entry.model';
import inventoryLedger from './inventory-ledger.service';
import logger from '../utils/logger.util';
import { sendEmail } from '../utils/email.util';

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

    // Try joining suppliers table first (preferred); fall back to users join if FK is on users
    let qb = supabase.from(SUPPLIER_ENTRIES_TABLE)
      .select('*', { count: 'exact' });

    if (query.status) qb = qb.eq('status', query.status);
    if (query.supplierId) qb = qb.eq('supplier_id', query.supplierId);
    if (query.search) qb = qb.ilike('item_name', `%${query.search}%`);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    // Enrich with supplier info using supplier_id
    const supplierIds = [...new Set((data || []).map((r: any) => r.supplier_id).filter(Boolean))];
    let supplierMap: Record<string, any> = {};
    if (supplierIds.length > 0) {
      // Try suppliers table first
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name, company_name, email')
        .in('id', supplierIds as string[]);
      if (suppliersData && suppliersData.length > 0) {
        suppliersData.forEach((s: any) => { supplierMap[s.id] = s; });
      } else {
        // Fall back to users table (legacy schema)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', supplierIds as string[]);
        (usersData || []).forEach((u: any) => { supplierMap[u.id] = u; });
      }
    }

    return {
      entries: (data || []).map((row: any) => {
        const entry = transformRow(row);
        const sup = supplierMap[row.supplier_id];
        if (sup) {
          entry.supplier = { id: sup.id, name: sup.company_name || sup.name || sup.email || 'Unknown', email: sup.email };
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

    // Check for duplicate product by slug to avoid creating duplicate products
    const { data: existingProduct } = await supabase.from('products').select('id, name').eq('slug', slug).maybeSingle();
    if (existingProduct) {
      throw new BadRequestError(`A product named "${existingProduct.name}" already exists. Please use a different product name.`);
    }

    const sellingPrice = Number(productData.sellingPrice || productData.price || entry.price) || 0;
    const originalPrice = Number(productData.originalPrice) || sellingPrice;
    const thumbnail = productData.thumbnail || productData.images?.[0] || 'https://placehold.co/400x400?text=Product';

    const costPrice = Number(entry.price) || 0;

    const productInsert: any = {
      name: productData.name,
      slug,
      sku,
      barcode,
      description: productData.description || '',
      price: sellingPrice,
      selling_price: sellingPrice,
      original_price: originalPrice,
      purchase_price: costPrice,
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
    try {
      await inventoryLedger.createFromConversion(
        product.id,
        entry.supplier_id,
        entryId,
        entry.quantity,
        entry.price || 0,
        adminId,
      );
    } catch (invErr) {
      // Rollback: delete the product that was just created
      await supabase.from('products').delete().eq('id', product.id);
      logger.error('Supplier entry conversion failed during inventory creation:', invErr);
      throw invErr;
    }

    // 4. Mark the entry as converted
    await supabase.from(SUPPLIER_ENTRIES_TABLE).update({
      status: 'converted',
      converted_product_id: product.id,
      converted_by: adminId,
      converted_at: new Date().toISOString(),
    }).eq('id', entryId);

    logger.info(`Supplier entry ${entryId} converted to product ${product.id} by admin ${adminId}`);

    // Notify supplier by email if possible
    try {
      const supplierEmail = await this.getSupplierEmail(entry.supplier_id);
      if (supplierEmail.email) {
        sendEmail({
          to: supplierEmail.email,
          subject: 'Your Submission Has Been Approved - AMOHA Mobiles',
          html: `<p>Dear ${supplierEmail.name || 'Supplier'},</p><p>Your submission for <strong>${entry.item_name}</strong> (Qty: ${entry.quantity}) has been <strong style="color:#059669">approved</strong> and added as a product.</p><p>Thank you for your contribution!</p>`,
        }).catch(() => {});
      }
    } catch { /* email errors should not break conversion */ }

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

    // Notify supplier by email if possible
    try {
      const supplierEmail = await this.getSupplierEmail(entry.supplier_id);
      if (supplierEmail.email) {
        sendEmail({
          to: supplierEmail.email,
          subject: 'Your Submission Was Not Approved - AMOHA Mobiles',
          html: `<p>Dear ${supplierEmail.name || 'Supplier'},</p><p>Your submission for <strong>${entry.item_name}</strong> has been <strong style="color:#dc2626">rejected</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>If you have questions, please contact us.</p>`,
        }).catch(() => {});
      }
    } catch { /* email errors should not break rejection */ }

    return transformRow(updated);
  }

  private async getSupplierEmail(supplierId: string): Promise<{ email?: string; name?: string }> {
    // Try suppliers table first
    const { data: supplier } = await supabase.from('suppliers').select('name, email').eq('id', supplierId).maybeSingle();
    if (supplier?.email) return { email: supplier.email, name: supplier.name };
    // Fall back to users table
    const { data: user } = await supabase.from('users').select('name, email').eq('id', supplierId).maybeSingle();
    if (user?.email) return { email: user.email, name: user.name };
    return {};
  }
}

export default new SupplierEntryService();
