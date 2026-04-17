import supabase from '../config/supabase';
import { transformRow, toDbRow, transformUser } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';
import crypto from 'crypto';
import { hashPassword } from '../utils/password.util';

function generatePoNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PO-${ts}-${rand}`;
}

function generateSupplierCode(): string {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SUP-${rand}`;
}

class SupplierService {
  // ==================== Suppliers CRUD ====================

  async getAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('suppliers').select('*', { count: 'exact' });

    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }
    if (query.status) qb = qb.eq('status', query.status);

    const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    const sortField = camelToSnake(query.sortBy || 'created_at');
    const sortAsc = query.sortOrder === 'asc';
    qb = qb.order(sortField, { ascending: sortAsc }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      suppliers: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getById(id: string) {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Supplier');

    // Fetch assigned products
    const { data: products } = await supabase
      .from('supplier_products')
      .select('*, products(id, name, sku, thumbnail, selling_price, stock)')
      .eq('supplier_id', id);

    const supplier = transformRow(data);
    supplier.products = (products || []).map(transformRow);
    return supplier;
  }

  async create(data: any) {
    const code = data.code || generateSupplierCode();
    const email = this.normalizeEmail(data.email);
    const password = typeof data.password === 'string' ? data.password.trim() : '';
    const fallbackName = (typeof data.name === 'string' && data.name.trim())
      ? data.name.trim()
      : (email ? email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Supplier' : 'Supplier');

    if (password && !email) {
      throw new BadRequestError('Email is required when creating a supplier login');
    }
    if (!fallbackName) {
      throw new BadRequestError('Supplier name or login email is required');
    }

    const account = await this.syncSupplierUserAccount({
      name: fallbackName,
      email,
      phone: data.phone,
      password,
    });

    const dbData = toDbRow({ ...data, name: fallbackName, code, email: email || null });
    delete dbData.password;

    const { data: supplier, error } = await supabase.from('suppliers').insert(dbData).select('*').single();
    if (error) throw error;

    const result = transformRow(supplier);
    if (account) {
      result.loginEnabled = true;
      result.loginEmail = account.email;
    }
    return result;
  }

  async update(id: string, updates: any) {
    const { data: existingSupplier, error: existingError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existingSupplier) throw new NotFoundError('Supplier');

    const nextName = updates.name ?? existingSupplier.name;
    const nextPhone = updates.phone ?? existingSupplier.phone;
    const nextEmail = this.normalizeEmail(updates.email ?? existingSupplier.email);
    const password = typeof updates.password === 'string' ? updates.password.trim() : '';

    if (password && !nextEmail) {
      throw new BadRequestError('Email is required when setting a supplier password');
    }

    const dbUpdates = toDbRow({ ...updates, email: nextEmail || null });
    delete dbUpdates.password;
    dbUpdates.updated_at = new Date().toISOString();

    const { data: supplier, error } = await supabase.from('suppliers').update(dbUpdates).eq('id', id).select('*').single();
    if (error) throw error;
    if (!supplier) throw new NotFoundError('Supplier');

    const account = await this.syncSupplierUserAccount({
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      password,
      previousEmail: existingSupplier.email,
    });

    const result = transformRow(supplier);
    if (account) {
      result.loginEnabled = true;
      result.loginEmail = account.email;
    }
    return result;
  }

  async delete(id: string) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }

  async getMyProfile(userId: string) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'supplier')
      .maybeSingle();
    if (userError) throw userError;
    if (!user) throw new NotFoundError('Supplier profile');

    let { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();
    if (supplierError) throw supplierError;

    if (!supplier) {
      const { data: createdSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({
          name: user.name || 'Supplier',
          code: generateSupplierCode(),
          email: user.email,
          phone: user.phone || '',
          status: 'active',
        })
        .select('*')
        .single();
      if (createError) throw createError;
      supplier = createdSupplier;
    }

    const result = transformRow(supplier);
    result.loginEmail = user.email;
    return result;
  }

  async updateMyProfile(userId: string, updates: any) {
    const profile = await this.getMyProfile(userId);
    const allowedUpdates = toDbRow({
      name: updates.name,
      phone: updates.phone,
      contactPerson: updates.contactPerson,
      addressLine1: updates.addressLine1,
      addressLine2: updates.addressLine2,
      city: updates.city,
      state: updates.state,
      pincode: updates.pincode,
      country: updates.country,
      gstNumber: updates.gstNumber,
      panNumber: updates.panNumber,
      bankName: updates.bankName,
      bankAccountNumber: updates.bankAccountNumber,
      bankIfsc: updates.bankIfsc,
      paymentTerms: updates.paymentTerms,
      notes: updates.notes,
    });
    allowedUpdates.updated_at = new Date().toISOString();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(allowedUpdates)
      .eq('id', profile.id)
      .select('*')
      .single();
    if (error) throw error;

    const userUpdates: any = {};
    if (typeof updates.name === 'string' && updates.name.trim()) userUpdates.name = updates.name.trim();
    if (typeof updates.phone === 'string') userUpdates.phone = updates.phone;
    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', userId);
    }

    const result = transformRow(supplier);
    result.loginEmail = profile.loginEmail;
    return result;
  }

  // ==================== Supplier Products ====================

  async assignProduct(supplierId: string, data: any) {
    const dbData = toDbRow({ supplierId, ...data });
    const { data: mapping, error } = await supabase.from('supplier_products').insert(dbData).select('*').single();
    if (error) {
      if (error.code === '23505') throw new BadRequestError('Product already assigned to this supplier');
      throw error;
    }
    return transformRow(mapping);
  }

  async removeProduct(supplierId: string, productId: string) {
    const { error } = await supabase.from('supplier_products').delete().eq('supplier_id', supplierId).eq('product_id', productId);
    if (error) throw error;
  }

  async getSupplierProducts(supplierId: string) {
    const { data, error } = await supabase
      .from('supplier_products')
      .select('*, products(id, name, sku, thumbnail, selling_price, stock)')
      .eq('supplier_id', supplierId);
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  async getProductSuppliers(productId: string) {
    const { data, error } = await supabase
      .from('supplier_products')
      .select('*, suppliers(id, name, code, reliability_score, avg_delivery_days)')
      .eq('product_id', productId);
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  // ==================== Purchase Orders ====================

  async getAllPurchaseOrders(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('purchase_orders').select('*, suppliers(id, name, code)', { count: 'exact' });

    if (query.search) {
      qb = qb.or(`po_number.ilike.%${query.search}%`);
    }
    if (query.status) qb = qb.eq('status', query.status);
    if (query.supplierId) qb = qb.eq('supplier_id', query.supplierId);
    if (query.paymentStatus) qb = qb.eq('payment_status', query.paymentStatus);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      purchaseOrders: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getPurchaseOrderById(id: string) {
    const { data: po, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(id, name, code, email, phone)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!po) throw new NotFoundError('Purchase Order');

    const { data: items } = await supabase
      .from('purchase_order_items')
      .select('*, products(id, name, sku, thumbnail)')
      .eq('purchase_order_id', id);

    const result = transformRow(po);
    result.items = (items || []).map(transformRow);
    return result;
  }

  async createPurchaseOrder(data: any, createdBy: string) {
    const poNumber = data.poNumber || generatePoNumber();
    const items = data.items || [];

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
      subtotal += item.totalCost;
    }
    const taxAmount = data.taxAmount || 0;
    const shippingCost = data.shippingCost || 0;
    const totalAmount = subtotal + taxAmount + shippingCost;

    const poDbData = toDbRow({
      poNumber,
      supplierId: data.supplierId,
      status: data.status || 'draft',
      orderDate: data.orderDate || new Date().toISOString(),
      expectedDelivery: data.expectedDelivery,
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      paymentStatus: data.paymentStatus || 'unpaid',
      notes: data.notes || '',
      createdBy,
    });

    const { data: po, error } = await supabase.from('purchase_orders').insert(poDbData).select('*').single();
    if (error) throw error;

    // Insert items
    if (items.length > 0) {
      const itemRows = items.map((item: any) => toDbRow({
        purchaseOrderId: po.id,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
      }));
      const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemRows);
      if (itemsError) {
        logger.error('Failed to insert PO items:', itemsError);
        throw itemsError;
      }
    }

    return this.getPurchaseOrderById(po.id);
  }

  async updatePurchaseOrder(id: string, updates: any) {
    const { items, ...poUpdates } = updates;

    if (Object.keys(poUpdates).length > 0) {
      const dbUpdates = toDbRow(poUpdates);
      dbUpdates.updated_at = new Date().toISOString();
      const { error } = await supabase.from('purchase_orders').update(dbUpdates).eq('id', id);
      if (error) throw error;
    }

    return this.getPurchaseOrderById(id);
  }

  async receivePurchaseOrder(id: string, receivedItems: any[]) {
    const po = await this.getPurchaseOrderById(id);

    let allReceived = true;
    let anyReceived = false;

    for (const ri of receivedItems) {
      const { itemId, receivedQty } = ri;
      const { error } = await supabase
        .from('purchase_order_items')
        .update({ received_qty: receivedQty })
        .eq('id', itemId);
      if (error) throw error;

      // Find the item to check if fully received
      const item = po.items?.find((i: any) => i._id === itemId || i.id === itemId);
      if (item) {
        if (receivedQty < item.quantity) allReceived = false;
        if (receivedQty > 0) anyReceived = true;

        // Update product stock
        if (receivedQty > 0) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.productId)
            .single();
          if (product) {
            const newStock = (product.stock || 0) + receivedQty;
            await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
          }
        }
      }
    }

    // Update PO status
    const newStatus = allReceived ? 'received' : (anyReceived ? 'partially_received' : po.status);
    if (newStatus !== po.status) {
      await supabase.from('purchase_orders').update({
        status: newStatus,
        actual_delivery: allReceived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }

    // Update supplier metrics
    if (allReceived) {
      await this.updateSupplierMetrics(po.supplierId, po.expectedDelivery);
    }

    return this.getPurchaseOrderById(id);
  }

  private normalizeEmail(email?: string) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  private async syncSupplierUserAccount(params: {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    previousEmail?: string;
  }) {
    const email = this.normalizeEmail(params.email);
    const previousEmail = this.normalizeEmail(params.previousEmail);

    if (params.password && !email) {
      throw new BadRequestError('Email is required when setting a supplier password');
    }

    if (!email) return null;

    let existingUser: any = null;

    if (previousEmail && previousEmail !== email) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', previousEmail)
        .eq('role', 'supplier')
        .maybeSingle();
      if (data) existingUser = data;
    }

    if (!existingUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (data) existingUser = data;
    }

    if (existingUser) {
      if (existingUser.role !== 'supplier') {
        throw new BadRequestError('This email is already used by another user account');
      }

      const userUpdates: any = {
        name: params.name,
        email,
        phone: params.phone || existingUser.phone || '',
        is_blocked: false,
      };

      if (params.password) {
        userUpdates.password = await hashPassword(params.password);
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', existingUser.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      return transformUser(updatedUser);
    }

    if (!params.password) return null;

    const hashedPassword = await hashPassword(params.password);
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: params.name,
        email,
        phone: params.phone || '',
        password: hashedPassword,
        role: 'supplier',
        is_verified: true,
      })
      .select('*')
      .single();
    if (createError) throw createError;
    return transformUser(createdUser);
  }

  // ==================== Analytics ====================

  async getSupplierAnalytics() {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, code, status, reliability_score, avg_delivery_days, total_orders, on_time_deliveries, defect_rate');
    if (error) throw error;

    const { data: poStats } = await supabase
      .from('purchase_orders')
      .select('supplier_id, total_amount, status');

    // Aggregate
    const analytics = (suppliers || []).map((s: any) => {
      const supplierPOs = (poStats || []).filter((po: any) => po.supplier_id === s.id && po.status !== 'cancelled');
      const totalPurchaseValue = supplierPOs.reduce((sum: number, po: any) => sum + parseFloat(po.total_amount || '0'), 0);
      return {
        ...transformRow(s),
        totalPurchaseValue,
        activePOs: supplierPOs.filter((po: any) => !['received', 'cancelled'].includes(po.status)).length,
        onTimePct: s.total_orders > 0 ? Math.round((s.on_time_deliveries / s.total_orders) * 100) : 0,
      };
    });

    return analytics;
  }

  async getDashboardStats() {
    const { count: totalSuppliers } = await supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: totalPOs } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true });
    const { count: pendingPOs } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent', 'confirmed']);

    const { data: poAmounts } = await supabase.from('purchase_orders').select('total_amount').neq('status', 'cancelled');
    const totalPurchaseValue = (poAmounts || []).reduce((sum: number, po: any) => sum + parseFloat(po.total_amount || '0'), 0);

    const { data: topSuppliers } = await supabase
      .from('suppliers')
      .select('id, name, code, reliability_score, total_orders')
      .eq('status', 'active')
      .order('reliability_score', { ascending: false })
      .limit(5);

    return {
      totalSuppliers: totalSuppliers || 0,
      totalPOs: totalPOs || 0,
      pendingPOs: pendingPOs || 0,
      totalPurchaseValue,
      topSuppliers: (topSuppliers || []).map(transformRow),
    };
  }

  // ==================== Internal Helpers ====================

  private async updateSupplierMetrics(supplierId: string, expectedDelivery?: Date) {
    try {
      const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', supplierId).single();
      if (!supplier) return;

      const totalOrders = (supplier.total_orders || 0) + 1;
      const now = new Date();
      const onTime = expectedDelivery ? now <= new Date(expectedDelivery) : true;
      const onTimeDeliveries = (supplier.on_time_deliveries || 0) + (onTime ? 1 : 0);
      const reliabilityScore = Math.min(5, Math.round(((onTimeDeliveries / totalOrders) * 5) * 10) / 10);

      await supabase.from('suppliers').update({
        total_orders: totalOrders,
        on_time_deliveries: onTimeDeliveries,
        reliability_score: reliabilityScore,
        updated_at: new Date().toISOString(),
      }).eq('id', supplierId);
    } catch (err) {
      logger.error('Failed to update supplier metrics:', err);
    }
  }
}

export default new SupplierService();
