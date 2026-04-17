import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

class InventoryService {
  // ==================== Warehouses CRUD ====================

  async getWarehouses(query: any = {}) {
    let qb = supabase.from('warehouses').select('*', { count: 'exact' });
    if (query.search) qb = qb.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%`);
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    qb = qb.order('is_default', { ascending: false }).order('name', { ascending: true });

    const { data, error, count } = await qb;
    if (error) throw error;
    return { warehouses: (data || []).map(transformRow), total: count || 0 };
  }

  async getWarehouseById(id: string) {
    const { data, error } = await supabase.from('warehouses').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Warehouse');
    return transformRow(data);
  }

  async createWarehouse(data: any) {
    const dbData = toDbRow(data);
    const { data: warehouse, error } = await supabase.from('warehouses').insert(dbData).select('*').single();
    if (error) throw error;
    return transformRow(warehouse);
  }

  async updateWarehouse(id: string, updates: any) {
    const dbUpdates = toDbRow(updates);
    dbUpdates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('warehouses').update(dbUpdates).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Warehouse');
    return transformRow(data);
  }

  async deleteWarehouse(id: string) {
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) throw error;
  }

  // ==================== Stock Tracking ====================

  async getStockOverview(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('products')
      .select('id, name, sku, barcode, thumbnail, stock, selling_price, brands(name), categories(name)', { count: 'exact' })
      .eq('is_active', true);

    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
    }
    if (query.stockStatus === 'out_of_stock') qb = qb.eq('stock', 0);
    else if (query.stockStatus === 'low') qb = qb.gt('stock', 0).lte('stock', 10);
    else if (query.stockStatus === 'normal') qb = qb.gt('stock', 10);

    const sortField = query.sortBy === 'name' ? 'name' : (query.sortBy === 'stock' ? 'stock' : 'stock');
    const sortAsc = query.sortOrder === 'desc' ? false : true;
    qb = qb.order(sortField, { ascending: sortAsc }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const products = (data || []).map((p: any) => {
      const t = transformRow(p);
      t.brandName = p.brands?.name || '';
      t.categoryName = p.categories?.name || '';
      t.stockStatus = p.stock === 0 ? 'out_of_stock' : p.stock <= 5 ? 'critical' : p.stock <= 10 ? 'low' : 'normal';
      return t;
    });

    return {
      products,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getWarehouseStock(warehouseId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('warehouse_stock')
      .select('*, products(id, name, sku, thumbnail, stock)', { count: 'exact' })
      .eq('warehouse_id', warehouseId);

    qb = qb.order('quantity', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      stock: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async updateStock(productId: string, quantity: number, type: string, userId: string, notes?: string, warehouseId?: string) {
    // Get current stock
    const { data: product } = await supabase.from('products').select('stock').eq('id', productId).single();
    if (!product) throw new NotFoundError('Product');

    const beforeQty = product.stock;
    let afterQty: number;

    if (type === 'adjustment') {
      afterQty = quantity; // absolute set
    } else if (type === 'in' || type === 'return') {
      afterQty = beforeQty + quantity;
    } else if (type === 'out' || type === 'damage') {
      afterQty = Math.max(0, beforeQty - quantity);
    } else {
      afterQty = beforeQty + quantity;
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: afterQty, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (updateError) throw updateError;

    // Log movement
    const movementData = toDbRow({
      productId,
      warehouseId: warehouseId || null,
      type,
      quantity: Math.abs(type === 'adjustment' ? quantity - beforeQty : quantity),
      referenceType: 'manual',
      beforeQty,
      afterQty,
      notes: notes || '',
      createdBy: userId,
    });

    await supabase.from('inventory_movements').insert(movementData);

    // Check low stock alerts
    if (afterQty <= 10) {
      await this.createStockAlert(productId, afterQty, warehouseId);
    }

    // Update warehouse stock if applicable
    if (warehouseId) {
      await this.upsertWarehouseStock(warehouseId, productId, afterQty);
    }

    return { productId, beforeQty, afterQty, type };
  }

  async bulkUpdateStock(items: any[], userId: string) {
    // Run stock updates in parallel for better throughput
    const results = await Promise.allSettled(
      items.map(async (item) => {
        const result = await this.updateStock(
          item.productId, item.quantity, item.type || 'adjustment', userId, item.notes, item.warehouseId
        );
        return { ...result, success: true };
      }),
    );
    return results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { productId: items[i].productId, success: false, error: (r.reason as Error).message },
    );
  }

  // ==================== Movement Logs ====================

  async getMovements(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('inventory_movements')
      .select('*, products(id, name, sku, thumbnail), warehouses(id, name, code)', { count: 'exact' });

    if (query.productId) qb = qb.eq('product_id', query.productId);
    if (query.warehouseId) qb = qb.eq('warehouse_id', query.warehouseId);
    if (query.type) qb = qb.eq('type', query.type);
    if (query.startDate) qb = qb.gte('created_at', query.startDate);
    if (query.endDate) qb = qb.lte('created_at', query.endDate);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      movements: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  // ==================== Stock Alerts ====================

  async getAlerts(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('stock_alerts')
      .select('*, products(id, name, sku, thumbnail, stock)', { count: 'exact' });

    if (query.alertType) qb = qb.eq('alert_type', query.alertType);
    if (query.isAcknowledged !== undefined) qb = qb.eq('is_acknowledged', query.isAcknowledged === 'true');

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      alerts: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const { data, error } = await supabase
      .from('stock_alerts')
      .update({ is_acknowledged: true, acknowledged_by: userId, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId)
      .select('*')
      .single();
    if (error) throw error;
    return transformRow(data);
  }

  async checkAndCreateAlerts() {
    // Scan all products for low/out-of-stock
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('is_active', true)
      .lte('stock', 10);

    let created = 0;
    for (const p of (products || [])) {
      const alertType = p.stock === 0 ? 'out_of_stock' : 'low_stock';

      // Check existing unacknowledged alert
      const { data: existing } = await supabase
        .from('stock_alerts')
        .select('id')
        .eq('product_id', p.id)
        .eq('alert_type', alertType)
        .eq('is_acknowledged', false)
        .maybeSingle();

      if (!existing) {
        await supabase.from('stock_alerts').insert({
          product_id: p.id,
          alert_type: alertType,
          current_stock: p.stock,
          threshold: alertType === 'out_of_stock' ? 0 : 10,
        });
        created++;
      }
    }
    return { scanned: (products || []).length, alertsCreated: created };
  }

  // ==================== Forecasting ====================

  async generateForecasts() {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('is_active', true);

    const allProducts = products || [];
    if (allProducts.length === 0) return { totalProducts: 0, reorderRecommended: 0, forecasts: [] };

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Batch fetch ALL order items from last 30 days (non-cancelled) in one query
    const productIds = allProducts.map(p => p.id);
    const { data: allOrderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, orders!inner(created_at, status)')
      .in('product_id', productIds)
      .gte('orders.created_at', thirtyDaysAgo)
      .neq('orders.status', 'cancelled');

    // Aggregate sold quantities per product
    const soldByProduct: Record<string, number> = {};
    for (const item of allOrderItems || []) {
      soldByProduct[item.product_id] = (soldByProduct[item.product_id] || 0) + (item.quantity || 0);
    }

    // Batch fetch existing forecasts for today
    const { data: existingForecasts } = await supabase
      .from('inventory_forecasts')
      .select('id, product_id')
      .eq('forecast_date', today)
      .in('product_id', productIds);
    const existingMap: Record<string, string> = {};
    for (const ef of existingForecasts || []) {
      existingMap[ef.product_id] = ef.id;
    }

    const forecasts = [];
    const upsertRows: any[] = [];

    for (const product of allProducts) {
      const totalSold = soldByProduct[product.id] || 0;
      const avgDailySales = Math.round((totalSold / 30) * 100) / 100;
      const daysOfStockRemaining = avgDailySales > 0 ? Math.floor(product.stock / avgDailySales) : 999;
      const reorderRecommended = daysOfStockRemaining <= 14;
      const recommendedQty = reorderRecommended ? Math.max(0, Math.ceil(avgDailySales * 30) - product.stock) : 0;
      const predictedDemand = Math.ceil(avgDailySales * 30);

      const forecastData: any = {
        product_id: product.id,
        forecast_date: today,
        predicted_demand: predictedDemand,
        avg_daily_sales: avgDailySales,
        days_of_stock_remaining: daysOfStockRemaining,
        reorder_recommended: reorderRecommended,
        recommended_qty: recommendedQty,
      };

      // If existing forecast, include its id for upsert
      if (existingMap[product.id]) {
        forecastData.id = existingMap[product.id];
      }

      upsertRows.push(forecastData);

      if (reorderRecommended) {
        forecasts.push({ productId: product.id, name: product.name, ...forecastData });
      }
    }

    // Batch upsert all forecasts at once
    if (upsertRows.length > 0) {
      await supabase.from('inventory_forecasts').upsert(upsertRows, { onConflict: 'id' });
    }

    return {
      totalProducts: allProducts.length,
      reorderRecommended: forecasts.length,
      forecasts,
    };
  }

  async getForecasts(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('inventory_forecasts')
      .select('*, products(id, name, sku, stock, thumbnail)', { count: 'exact' });

    if (query.reorderOnly === 'true') qb = qb.eq('reorder_recommended', true);
    if (query.productId) qb = qb.eq('product_id', query.productId);

    qb = qb.order('days_of_stock_remaining', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      forecasts: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats() {
    const { data: stockStats } = await supabase
      .from('products')
      .select('stock')
      .eq('is_active', true);

    const products = stockStats || [];
    const totalProducts = products.length;
    const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
    const outOfStock = products.filter((p: any) => p.stock === 0).length;
    const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 10).length;

    const { count: totalWarehouses } = await supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: pendingAlerts } = await supabase.from('stock_alerts').select('*', { count: 'exact', head: true }).eq('is_acknowledged', false);

    // Recent movements count (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentMovements } = await supabase
      .from('inventory_movements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    // Stock value
    const { data: valueData } = await supabase
      .from('products')
      .select('stock, selling_price')
      .eq('is_active', true);
    const totalStockValue = (valueData || []).reduce((sum: number, p: any) => {
      const stock = Number(p.stock) || 0;
      const price = Number(p.selling_price) || 0;
      return sum + (stock * price);
    }, 0);

    return {
      totalProducts,
      totalStock,
      outOfStock,
      lowStock,
      totalWarehouses: totalWarehouses || 0,
      pendingAlerts: pendingAlerts || 0,
      recentMovements: recentMovements || 0,
      totalStockValue: Math.round(totalStockValue),
    };
  }

  // ==================== Internal Helpers ====================

  private async createStockAlert(productId: string, currentStock: number, warehouseId?: string) {
    const alertType = currentStock === 0 ? 'out_of_stock' : 'low_stock';
    const threshold = alertType === 'out_of_stock' ? 0 : 10;

    const { data: existing } = await supabase
      .from('stock_alerts')
      .select('id')
      .eq('product_id', productId)
      .eq('alert_type', alertType)
      .eq('is_acknowledged', false)
      .maybeSingle();

    if (!existing) {
      await supabase.from('stock_alerts').insert({
        product_id: productId,
        warehouse_id: warehouseId || null,
        alert_type: alertType,
        current_stock: currentStock,
        threshold,
      });
    }
  }

  private async upsertWarehouseStock(warehouseId: string, productId: string, quantity: number) {
    const { data: existing } = await supabase
      .from('warehouse_stock')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase.from('warehouse_stock')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('warehouse_stock')
        .insert({ warehouse_id: warehouseId, product_id: productId, quantity });
    }
  }
}

export default new InventoryService();
