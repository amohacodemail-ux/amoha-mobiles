import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';
import inventoryLedger from './inventory-ledger.service';
import crypto from 'crypto';
import {
  GRN_TABLE,
  GRN_ITEM_TABLE,
  PURCHASE_RETURN_TABLE,
  PURCHASE_RETURN_ITEM_TABLE,
  PURCHASE_PAYMENT_TABLE,
  PURCHASE_ORDER_TABLE,
  PURCHASE_ORDER_ITEM_TABLE,
  SUPPLIER_TABLE,
} from '../models/supplier.model';

function generateGRNNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `GRN-${ts}`;
}

function generateReturnNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `PR-${ts}`;
}

class PurchaseService {
  // ==================== GRN ====================
  async createGRN(data: any, userId?: string) {
    const { poId, supplierId, items, invoiceChallanNumber, warehouseLocation, notes, receivedDate } = data;

    if (!poId || !supplierId || !items || !items.length) {
      throw new BadRequestError('PO ID, Supplier ID, and items are required');
    }

    // Generate GRN Number
    const grnNumber = generateGRNNumber();

    // Verify PO exists and matches supplier
    const { data: poData, error: poError } = await supabase
      .from(PURCHASE_ORDER_TABLE)
      .select('id, supplier_id, status')
      .eq('id', poId)
      .single();
    
    if (poError || !poData) throw new NotFoundError('Purchase Order');
    if (poData.supplier_id !== supplierId) throw new BadRequestError('Supplier does not match Purchase Order');
    if (poData.status === 'completed') throw new BadRequestError('Purchase Order is already fully received');

    // Create GRN record
    const { data: grnData, error: grnError } = await supabase
      .from(GRN_TABLE)
      .insert(
        toDbRow({
          grnNumber,
          poId,
          supplierId,
          status: 'pending',
          invoiceChallanNumber: invoiceChallanNumber || null,
          warehouseLocation: warehouseLocation || null,
          receivedBy: userId || null,
          receivedDate: receivedDate || new Date().toISOString(),
          notes: notes || '',
        })
      )
      .select('*')
      .single();

    if (grnError) throw new BadRequestError(`Failed to create GRN: ${grnError.message}`);

    const grnId = grnData.id;

    // Create GRN Items
    const grnItemsData = items.map((item: any) => {
      const received = item.receivedQty || 0;
      const rejected = item.rejectedQty || 0;
      const accepted = received - rejected;
      return {
        grn_id: grnId,
        product_id: item.productId,
        ordered_qty: item.orderedQty || 0,
        received_qty: received,
        accepted_qty: accepted,
        rejected_qty: rejected,
        rejection_reason: item.rejectionReason || null,
        unit_price: item.unitPrice || 0,
        total_amount: accepted * (item.unitPrice || 0),
      };
    });

    const { error: itemsError } = await supabase.from(GRN_ITEM_TABLE).insert(grnItemsData);
    if (itemsError) throw new BadRequestError(`Failed to insert GRN items: ${itemsError.message}`);

    return this.getGRNById(grnId);
  }

  async updateGRN(grnId: string, data: any, userId?: string) {
    const grn = await this.getGRNById(grnId);
    if (grn.status !== 'pending') {
      throw new BadRequestError('Only pending GRNs can be edited');
    }

    // Update GRN fields
    const updateData: any = {};
    if (data.invoiceChallanNumber !== undefined) updateData.invoice_challan_number = data.invoiceChallanNumber;
    if (data.warehouseLocation !== undefined) updateData.warehouse_location = data.warehouseLocation;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      await supabase.from(GRN_TABLE).update(updateData).eq('id', grnId);
    }

    // Update Items
    if (data.items && data.items.length > 0) {
      // First delete existing items
      await supabase.from(GRN_ITEM_TABLE).delete().eq('grn_id', grnId);

      // Insert new items
      const grnItemsData = data.items.map((item: any) => ({
        grn_id: grnId,
        product_id: item.productId,
        ordered_qty: item.orderedQty || 0,
        received_qty: item.receivedQty || 0,
        accepted_qty: item.acceptedQty || 0,
        rejected_qty: item.rejectedQty || 0,
        rejection_reason: item.rejectionReason || null,
        unit_price: item.unitPrice || 0,
        total_amount: item.totalAmount || 0,
      }));
      await supabase.from(GRN_ITEM_TABLE).insert(grnItemsData);
    }

    return this.getGRNById(grnId);
  }

  async getGRNById(grnId: string) {
    const { data, error } = await supabase
      .from(GRN_TABLE)
      .select('*, items:goods_receipt_note_items(*)')
      .eq('id', grnId)
      .single();
    if (error || !data) throw new NotFoundError('GRN not found');
    return transformRow(data);
  }

  async verifyGRN(grnId: string, userId?: string) {
    const grn = await this.getGRNById(grnId);
    if (grn.status === 'completed') {
      throw new BadRequestError('GRN is already completed');
    }

    // Update inventory for accepted quantity
    for (const item of (grn.items || [])) {
      if (item.acceptedQty > 0 && item.productId) {
        try {
          await inventoryLedger.addStock(
            item.productId,
            item.acceptedQty,
            `GRN verification for ${grn.grnNumber}`,
            userId || 'system'
          );
        } catch (err: any) {
          logger.error(`Failed to update inventory for product ${item.productId}: ${err.message}`);
          throw new BadRequestError(`Inventory update failed: ${err.message}`);
        }
      }

      // Update PO item received quantity and pending quantity
      // First, get the current PO item
      const { data: poItem } = await supabase
        .from(PURCHASE_ORDER_ITEM_TABLE)
        .select('id, quantity, received_qty, pending_qty')
        .eq('purchase_order_id', grn.poId)
        .eq('product_id', item.productId)
        .single();
      
      if (poItem) {
        const newReceivedQty = (poItem.received_qty || 0) + item.acceptedQty;
        const newPendingQty = Math.max(0, poItem.quantity - newReceivedQty);

        await supabase
          .from(PURCHASE_ORDER_ITEM_TABLE)
          .update({
            received_qty: newReceivedQty,
            pending_qty: newPendingQty
          })
          .eq('id', poItem.id);
      }
    }

    // Check if PO is fully received
    const { data: allPoItems } = await supabase
      .from(PURCHASE_ORDER_ITEM_TABLE)
      .select('quantity, received_qty')
      .eq('purchase_order_id', grn.poId);

    if (allPoItems && allPoItems.length > 0) {
      const isFullyReceived = allPoItems.every(i => (i.received_qty || 0) >= i.quantity);
      if (isFullyReceived) {
        await supabase
          .from(PURCHASE_ORDER_TABLE)
          .update({ status: 'completed' })
          .eq('id', grn.poId);
      }
    }

    // Update GRN status directly to completed
    const { data, error } = await supabase
      .from(GRN_TABLE)
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', grnId)
      .select('*')
      .single();

    if (error) throw new BadRequestError(`Failed to complete GRN: ${error.message}`);

    return transformRow(data);
  }

  async getGRNs(query: any = {}) {
    let q = supabase
      .from(GRN_TABLE)
      .select(`
        *,
        supplier:supplier_id (id, name, code),
        purchaseOrder:po_id (id, po_number),
        items:goods_receipt_note_items (*, products(id, name, sku))
      `)
      .order('created_at', { ascending: false });

    if (query.supplierId) q = q.eq('supplier_id', query.supplierId);
    if (query.poId) q = q.eq('po_id', query.poId);

    const { data, error } = await q;
    if (error) throw new BadRequestError(`Failed to fetch GRNs: ${error.message}`);
    return data.map(transformRow);
  }

  // ==================== Returns ====================
  async createReturn(data: any, userId?: string) {
    const { poId, grnId, supplierId, items, notes, totalAmount } = data;

    if (!supplierId || !items || !items.length) {
      throw new BadRequestError('Supplier ID and items are required');
    }

    const returnNumber = generateReturnNumber();
    
    const { data: retData, error: retError } = await supabase
      .from(PURCHASE_RETURN_TABLE)
      .insert(
        toDbRow({
          returnNumber,
          poId,
          grnId,
          supplierId,
          status: 'returned',
          totalAmount: totalAmount || 0,
          notes,
        })
      )
      .select('*')
      .single();

    if (retError) throw new BadRequestError(`Failed to create Purchase Return: ${retError.message}`);
    const returnId = retData.id;

    const returnItemsData = items.map((item: any) => ({
      return_id: returnId,
      product_id: item.productId,
      return_qty: item.returnQty,
      unit_price: item.unitPrice,
      reason: item.reason,
    }));

    await supabase.from(PURCHASE_RETURN_ITEM_TABLE).insert(returnItemsData);

    // Update Inventory for each returned item
    for (const item of items) {
      if (item.returnQty > 0 && item.productId) {
        try {
          await inventoryLedger.removeStock(item.productId, item.returnQty, `Purchase Return: ${returnNumber}`, userId || 'system');
        } catch (err: any) {
          logger.error(`Failed to update inventory for product ${item.productId}: ${err.message}`);
        }
      }
    }

    return transformRow(retData);
  }

  async getReturns(query: any = {}) {
    let q = supabase
      .from(PURCHASE_RETURN_TABLE)
      .select(`
        *,
        supplier:supplier_id (id, name, code),
        purchaseOrder:po_id (id, po_number),
        items:purchase_return_items (*)
      `)
      .order('created_at', { ascending: false });

    if (query.supplierId) q = q.eq('supplier_id', query.supplierId);

    const { data, error } = await q;
    if (error) throw new BadRequestError(`Failed to fetch Returns: ${error.message}`);
    return data.map(transformRow);
  }

  // ==================== Payments ====================
  async createPayment(data: any) {
    const { poId, supplierId, amount, paymentMethod, referenceNumber, notes } = data;

    if (!poId || !supplierId || !amount) {
      throw new BadRequestError('PO ID, Supplier ID, and amount are required');
    }

    const { data: poData } = await supabase
      .from(PURCHASE_ORDER_TABLE)
      .select('id, total_amount')
      .eq('id', poId)
      .single();

    if (!poData) throw new NotFoundError('Purchase Order not found');

    const { data: payData, error: payError } = await supabase
      .from(PURCHASE_PAYMENT_TABLE)
      .insert(
        toDbRow({
          poId,
          supplierId,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
        })
      )
      .select('*')
      .single();

    if (payError) throw new BadRequestError(`Failed to record payment: ${payError.message}`);

    // Calculate total paid for this PO
    const { data: allPayments } = await supabase
      .from(PURCHASE_PAYMENT_TABLE)
      .select('amount')
      .eq('po_id', poId);

    const totalPaid = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    
    let paymentStatus = 'unpaid';
    if (totalPaid >= poData.total_amount) paymentStatus = 'paid';
    else if (totalPaid > 0) paymentStatus = 'partial';

    await supabase
      .from(PURCHASE_ORDER_TABLE)
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', poId);

    return transformRow(payData);
  }

  async getPayments(query: any = {}) {
    let q = supabase
      .from(PURCHASE_PAYMENT_TABLE)
      .select(`
        *,
        supplier:supplier_id (id, name, code),
        purchaseOrder:po_id (id, po_number, total_amount, payment_status)
      `)
      .order('created_at', { ascending: false });

    if (query.supplierId) q = q.eq('supplier_id', query.supplierId);
    if (query.poId) q = q.eq('po_id', query.poId);

    const { data, error } = await q;
    if (error) throw new BadRequestError(`Failed to fetch Payments: ${error.message}`);
    return data.map(transformRow);
  }

  // ==================== Reports ====================
  async getReports(query: any = {}) {
    // Basic aggregation fetching
    // Supplier-wise Purchase Report
    const { data: supplierStats, error } = await supabase
      .from(PURCHASE_ORDER_TABLE)
      .select(`
        supplier_id,
        supplier:supplier_id (id, name),
        total_amount,
        payment_status
      `)
      .neq('status', 'cancelled');
    
    // Aggregate by supplier
    const supplierReport: Record<string, any> = {};
    if (supplierStats) {
      supplierStats.forEach((po: any) => {
        const supId = po.supplier_id;
        if (!supplierReport[supId]) {
          supplierReport[supId] = {
            supplierId: supId,
            supplierName: po.supplier?.name || 'Unknown',
            totalPurchase: 0,
            outstandingBalance: 0,
          };
        }
        supplierReport[supId].totalPurchase += Number(po.total_amount || 0);
        if (po.payment_status !== 'paid') {
          // This is a rough outstanding balance. A real system might subtract actual payments.
          // For simplicity in reporting, we'll do an approximation or fetch payments per supplier.
        }
      });
    }

    // Since this is a summary endpoint, we could return multiple aggregated datasets.
    return {
      supplierReport: Object.values(supplierReport),
      // Extend with daily, monthly, product-wise if necessary via direct queries
    };
  }
}

export default new PurchaseService();
