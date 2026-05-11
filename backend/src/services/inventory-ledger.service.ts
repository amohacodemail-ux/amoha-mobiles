import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

/**
 * InventoryLedgerService — the SINGLE source of truth for stock.
 * All stock mutations MUST go through this service.
 */
class InventoryLedgerService {
  // ==================== Core: Create inventory record ====================

  /** Auto-create inventory when a product is created from a supplier entry conversion. */
  async createFromConversion(
    productId: string,
    supplierUserId: string,
    supplierEntryId: string,
    quantity: number,
    costPrice: number,
    performedBy: string,
  ) {
    // Check no duplicate
    const { data: existing } = await supabase
      .from('inventory').select('id').eq('product_id', productId).maybeSingle();
    if (existing) throw new BadRequestError('Inventory record already exists for this product');

    const record = {
      product_id: productId,
      supplier_id: null,
      supplier_entry_id: supplierEntryId,
      total_stock: quantity,
      available_stock: quantity,
      reserved_stock: 0,
      sold_stock: 0,
      damaged_stock: 0,
      cost_price: costPrice || 0,
      last_restocked_at: new Date().toISOString(),
    };

    const { data: inv, error } = await supabase
      .from('inventory').insert(record).select('*').single();
    if (error) throw error;

    // Sync product stock column
    await supabase.from('products').update({ stock: quantity }).eq('id', productId);

    // Audit
    await this.audit(inv.id, productId, 'created', quantity, {}, {
      totalStock: quantity, availableStock: quantity, reservedStock: 0, soldStock: 0,
    }, 'supplier_entry', supplierEntryId, 'Inventory created from supplier entry conversion', performedBy);

    return transformRow(inv);
  }

  /** Ensure an inventory record exists for a product (create if not). */
  async ensureRecord(productId: string) {
    const { data } = await supabase
      .from('inventory').select('*').eq('product_id', productId).maybeSingle();
    if (data) return transformRow(data);

    // Read current product stock and create record
    const { data: product } = await supabase
      .from('products').select('stock').eq('id', productId).maybeSingle();
    const stock = product?.stock || 0;

    const { data: inv, error } = await supabase.from('inventory').insert({
      product_id: productId,
      total_stock: stock,
      available_stock: stock,
      reserved_stock: 0,
      sold_stock: 0,
      damaged_stock: 0,
    }).select('*').single();
    if (error) throw error;
    return transformRow(inv);
  }

  // ==================== Order flow ====================

  /** When an order is PLACED: available → reserved. */
  async reserveForOrder(orderId: string, items: { productId: string; quantity: number }[], performedBy?: string) {
    for (const item of items) {
      const inv = await this.getByProductId(item.productId);
      if (!inv) {
        logger.warn(`No inventory record for product ${item.productId}, skipping reserve`);
        continue;
      }

      if (inv.availableStock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product. Available: ${inv.availableStock}, Requested: ${item.quantity}`
        );
      }

      const before = this.snapshot(inv);
      const newAvailable = inv.availableStock - item.quantity;
      const newReserved = inv.reservedStock + item.quantity;

      await supabase.from('inventory').update({
        available_stock: newAvailable,
        reserved_stock: newReserved,
        updated_at: new Date().toISOString(),
      }).eq('id', inv._id);

      // Keep products.stock in sync (available = what customers see)
      await supabase.from('products').update({ stock: newAvailable }).eq('id', item.productId);

      const after = { ...before, availableStock: newAvailable, reservedStock: newReserved };
      await this.audit(inv._id, item.productId, 'order_placed', item.quantity, before, after, 'order', orderId, `Reserved ${item.quantity} units for order`, performedBy || null);
    }
  }

  /** When an order is CANCELLED: reserved → available. */
  async unreserveForOrder(orderId: string, items: { productId: string; quantity: number }[], performedBy?: string) {
    for (const item of items) {
      const inv = await this.getByProductId(item.productId);
      if (!inv) continue;

      const before = this.snapshot(inv);
      const qtyToUnreserve = Math.min(item.quantity, inv.reservedStock);
      const newAvailable = inv.availableStock + qtyToUnreserve;
      const newReserved = inv.reservedStock - qtyToUnreserve;

      await supabase.from('inventory').update({
        available_stock: newAvailable,
        reserved_stock: newReserved,
        updated_at: new Date().toISOString(),
      }).eq('id', inv._id);

      await supabase.from('products').update({ stock: newAvailable }).eq('id', item.productId);

      const after = { ...before, availableStock: newAvailable, reservedStock: newReserved };
      await this.audit(inv._id, item.productId, 'order_cancelled', qtyToUnreserve, before, after, 'order', orderId, `Unreserved ${qtyToUnreserve} units (order cancelled)`, performedBy || null);
    }
  }

  /** When an order is DELIVERED: reserved → sold. */
  async markSoldForOrder(orderId: string, items: { productId: string; quantity: number }[], performedBy?: string) {
    for (const item of items) {
      const inv = await this.getByProductId(item.productId);
      if (!inv) continue;

      const before = this.snapshot(inv);
      const qtyToSell = Math.min(item.quantity, inv.reservedStock);
      const newReserved = inv.reservedStock - qtyToSell;
      const newSold = inv.soldStock + qtyToSell;

      await supabase.from('inventory').update({
        reserved_stock: newReserved,
        sold_stock: newSold,
        updated_at: new Date().toISOString(),
      }).eq('id', inv._id);

      const after = { ...before, reservedStock: newReserved, soldStock: newSold };
      await this.audit(inv._id, item.productId, 'order_delivered', qtyToSell, before, after, 'order', orderId, `Sold ${qtyToSell} units (order delivered)`, performedBy || null);
    }
  }

  /** POS / immediate sale: available → sold directly (no reserve step). */
  async markDirectSale(orderId: string, items: { productId: string; quantity: number }[], performedBy?: string) {
    for (const item of items) {
      const inv = await this.ensureRecord(item.productId);
      const qty = Math.min(item.quantity, inv.availableStock);
      if (qty <= 0) continue;

      const before = this.snapshot(inv);
      const newAvailable = inv.availableStock - qty;
      const newTotal = inv.totalStock - qty;
      const newSold = inv.soldStock + qty;

      const { error: invErr } = await supabase.from('inventory').update({
        available_stock: newAvailable,
        total_stock: Math.max(0, newTotal),
        sold_stock: newSold,
        updated_at: new Date().toISOString(),
      }).eq('id', inv._id);
      if (invErr) logger.error(`[markDirectSale] inventory update error: ${invErr.message}`);
      else logger.info(`[markDirectSale] inventory updated: id=${inv._id} avail=${newAvailable} sold=${newSold}`);

      await supabase.from('products').update({ stock: newAvailable }).eq('id', item.productId);

      const after = { ...before, availableStock: newAvailable, totalStock: Math.max(0, newTotal), soldStock: newSold };
      await this.audit(inv._id, item.productId, 'order_delivered', qty, before, after, 'order', orderId, `POS sale - ${qty} units sold`, performedBy || null);
    }
  }

  // ==================== Manual stock operations ====================

  async addStock(productId: string, quantity: number, notes: string, performedBy: string) {
    const inv = await this.ensureRecord(productId);
    const before = this.snapshot(inv);

    const newTotal = inv.totalStock + quantity;
    const newAvailable = inv.availableStock + quantity;

    await supabase.from('inventory').update({
      total_stock: newTotal,
      available_stock: newAvailable,
      last_restocked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', inv._id);

    await supabase.from('products').update({ stock: newAvailable }).eq('id', productId);

    const after = { ...before, totalStock: newTotal, availableStock: newAvailable };
    await this.audit(inv._id, productId, 'stock_added', quantity, before, after, 'manual', null, notes || `Added ${quantity} units`, performedBy);

    return { before, after, quantityChanged: quantity };
  }

  async removeStock(productId: string, quantity: number, notes: string, performedBy: string) {
    const inv = await this.ensureRecord(productId);
    if (inv.availableStock < quantity) {
      throw new BadRequestError(`Cannot remove ${quantity} units. Only ${inv.availableStock} available.`);
    }
    const before = this.snapshot(inv);

    const newTotal = inv.totalStock - quantity;
    const newAvailable = inv.availableStock - quantity;

    await supabase.from('inventory').update({
      total_stock: Math.max(0, newTotal),
      available_stock: newAvailable,
      updated_at: new Date().toISOString(),
    }).eq('id', inv._id);

    await supabase.from('products').update({ stock: newAvailable }).eq('id', productId);

    const after = { ...before, totalStock: Math.max(0, newTotal), availableStock: newAvailable };
    await this.audit(inv._id, productId, 'stock_removed', quantity, before, after, 'manual', null, notes || `Removed ${quantity} units`, performedBy);

    return { before, after, quantityChanged: -quantity };
  }

  async adjustStock(productId: string, newAvailableStock: number, notes: string, performedBy: string) {
    const inv = await this.ensureRecord(productId);
    if (newAvailableStock < 0) throw new BadRequestError('Stock cannot be negative');
    const before = this.snapshot(inv);

    const diff = newAvailableStock - inv.availableStock;
    const newTotal = inv.totalStock + diff;

    await supabase.from('inventory').update({
      total_stock: Math.max(0, newTotal),
      available_stock: newAvailableStock,
      updated_at: new Date().toISOString(),
    }).eq('id', inv._id);

    await supabase.from('products').update({ stock: newAvailableStock }).eq('id', productId);

    const after = { ...before, totalStock: Math.max(0, newTotal), availableStock: newAvailableStock };
    await this.audit(inv._id, productId, 'stock_adjusted', Math.abs(diff), before, after, 'manual', null, notes || `Adjusted stock to ${newAvailableStock}`, performedBy);

    return { before, after, quantityChanged: diff };
  }

  async markDamaged(productId: string, quantity: number, notes: string, performedBy: string) {
    const inv = await this.ensureRecord(productId);
    if (inv.availableStock < quantity) {
      throw new BadRequestError(`Cannot mark ${quantity} as damaged. Only ${inv.availableStock} available.`);
    }
    const before = this.snapshot(inv);

    const newAvailable = inv.availableStock - quantity;
    const newDamaged = inv.damagedStock + quantity;

    await supabase.from('inventory').update({
      available_stock: newAvailable,
      damaged_stock: newDamaged,
      updated_at: new Date().toISOString(),
    }).eq('id', inv._id);

    await supabase.from('products').update({ stock: newAvailable }).eq('id', productId);

    const after = { ...before, availableStock: newAvailable, damagedStock: newDamaged };
    await this.audit(inv._id, productId, 'damaged', quantity, before, after, 'damage', null, notes || `Marked ${quantity} units as damaged`, performedBy);

    return { before, after, quantityChanged: -quantity };
  }

  // ==================== Queries ====================

  async getByProductId(productId: string) {
    const { data, error } = await supabase
      .from('inventory').select('*').eq('product_id', productId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return transformRow(data);
  }

  async getAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    // Query the inventory_overview view for enriched data
    let qb = supabase.from('inventory_overview').select('*', { count: 'exact' });

    if (query.search) {
      qb = qb.or(`product_name.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
    }
    if (query.stockStatus === 'out_of_stock') qb = qb.eq('stock_status', 'out_of_stock');
    else if (query.stockStatus === 'critical') qb = qb.eq('stock_status', 'critical');
    else if (query.stockStatus === 'low') qb = qb.eq('stock_status', 'low');
    else if (query.stockStatus === 'in_stock') qb = qb.eq('stock_status', 'in_stock');

    if (query.supplierId) qb = qb.eq('supplier_id', query.supplierId);

    qb = qb.order('available_stock', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      items: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getDashboardStats() {
    const { data: allInv } = await supabase.from('inventory').select('total_stock, available_stock, reserved_stock, sold_stock, cost_price');
    const items = allInv || [];

    const totalProducts = items.length;
    const outOfStock = items.filter(i => i.available_stock === 0).length;
    const lowStock = items.filter(i => i.available_stock > 0 && i.available_stock <= 10).length;
    const totalStockUnits = items.reduce((s, i) => s + i.total_stock, 0);
    const totalAvailable = items.reduce((s, i) => s + i.available_stock, 0);
    const totalReserved = items.reduce((s, i) => s + i.reserved_stock, 0);
    const totalSold = items.reduce((s, i) => s + i.sold_stock, 0);
    const totalStockValue = items.reduce((s, i) => s + ((Number(i.available_stock) || 0) * (Number(i.cost_price) || 0)), 0);

    // Pending supplier entries
    const { count: pendingEntries } = await supabase
      .from('supplier_entries').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    return {
      totalProducts,
      outOfStock,
      lowStock,
      totalStockUnits,
      totalAvailable,
      totalReserved,
      totalSold,
      totalStockValue: Math.round(totalStockValue),
      pendingEntries: pendingEntries || 0,
    };
  }

  async getAuditLog(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('inventory_audit_log')
      .select('*, products(id, name, sku)', { count: 'exact' });

    if (query.productId) qb = qb.eq('product_id', query.productId);
    if (query.action) qb = qb.eq('action', query.action);
    if (query.referenceType) qb = qb.eq('reference_type', query.referenceType);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      logs: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async exportStockCsv(): Promise<string> {
    const { data, error } = await supabase
      .from('inventory_overview')
      .select('*')
      .order('available_stock', { ascending: true });
    if (error) throw error;

    const rows = (data || []).map(transformRow);
    const header = 'Product,SKU,Brand,Category,Total,Available,Reserved,Sold,Damaged,Cost Price,Selling Price,Status,Last Restocked';
    const lines = rows.map((r: any) =>
      [
        `"${(r.productName || '').replace(/"/g, '""')}"`,
        r.sku || '',
        `"${(r.brandName || '').replace(/"/g, '""')}"`,
        `"${(r.categoryName || '').replace(/"/g, '""')}"`,
        r.totalStock ?? 0,
        r.availableStock ?? 0,
        r.reservedStock ?? 0,
        r.soldStock ?? 0,
        r.damagedStock ?? 0,
        r.costPrice ?? 0,
        r.sellingPrice ?? 0,
        r.stockStatus || '',
        r.lastRestockedAt ? new Date(r.lastRestockedAt).toLocaleDateString('en-IN') : '',
      ].join(',')
    );
    return [header, ...lines].join('\n');
  }

  // ==================== Internals ====================

  private snapshot(inv: any) {
    return {
      totalStock: inv.totalStock,
      availableStock: inv.availableStock,
      reservedStock: inv.reservedStock,
      soldStock: inv.soldStock,
      damagedStock: inv.damagedStock || 0,
    };
  }

  private async audit(
    inventoryId: string,
    productId: string,
    action: string,
    quantityChanged: number,
    beforeState: any,
    afterState: any,
    referenceType: string | null,
    referenceId: string | null,
    notes: string,
    performedBy: string | null,
  ) {
    try {
      await supabase.from('inventory_audit_log').insert({
        inventory_id: inventoryId,
        product_id: productId,
        action,
        quantity_changed: quantityChanged,
        before_state: beforeState,
        after_state: afterState,
        reference_type: referenceType,
        reference_id: referenceId,
        notes,
        performed_by: performedBy,
      });
    } catch (err) {
      logger.error('Failed to write inventory audit log:', err);
    }
  }
}

export const inventoryLedger = new InventoryLedgerService();
export default inventoryLedger;
