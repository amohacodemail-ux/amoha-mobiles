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
    const { poId, supplierId, receivedDate, items, notes } = data;

    if (!poId || !supplierId || !items || !items.length) {
      throw new BadRequestError('PO ID, Supplier ID and items are required');
    }

    const grnNumber = generateGRNNumber();
    
    // Create GRN
    const { data: grnData, error: grnError } = await supabase
      .from(GRN_TABLE)
      .insert(
        toDbRow({
          grnNumber,
          poId,
          supplierId,
          status: 'received',
          receivedDate: receivedDate || new Date().toISOString(),
          notes,
        })
      )
      .select('*')
      .single();

    if (grnError) throw new BadRequestError(`Failed to create GRN: ${grnError.message}`);
    const grnId = grnData.id;

    // Create GRN Items and update inventory
    const grnItemsData = items.map((item: any) => ({
      grn_id: grnId,
      product_id: item.productId,
      ordered_qty: item.orderedQty,
      received_qty: item.receivedQty,
      damaged_qty: item.damagedQty,
      pending_qty: item.orderedQty - (item.receivedQty + item.damagedQty),
      po_item_id: item.poItemId // Make sure we have the PO item ID
    }));

    const { error: itemsError } = await supabase
      .from(GRN_ITEM_TABLE)
      .insert(grnItemsData);

    if (itemsError) throw new BadRequestError(`Failed to create GRN items: ${itemsError.message}`);

    // Update PO Items received_qty
    for (const item of items) {
      if (item.poItemId && (item.receivedQty > 0 || item.damagedQty > 0)) {
        // Fetch current received_qty
        const { data: poItem } = await supabase
          .from(PURCHASE_ORDER_ITEM_TABLE)
          .select('received_qty')
          .eq('id', item.poItemId)
          .single();
        
        const currentReceived = poItem?.received_qty || 0;
        const newReceived = currentReceived + item.receivedQty + item.damagedQty; // Consider damaged as received for pending calc
        
        await supabase
          .from(PURCHASE_ORDER_ITEM_TABLE)
          .update({ received_qty: newReceived })
          .eq('id', item.poItemId);
      }
    }

    // Update PO Status
    // A PO is fully received if all its items have received_qty >= quantity
    const { data: poItems } = await supabase
      .from(PURCHASE_ORDER_ITEM_TABLE)
      .select('quantity, received_qty')
      .eq('purchase_order_id', poId);
      
    let anyPending = false;
    if (poItems) {
      anyPending = poItems.some((i: any) => (i.quantity || 0) > (i.received_qty || 0));
    }

    const poStatus = anyPending ? 'partially_received' : 'received';

    await supabase
      .from(PURCHASE_ORDER_TABLE)
      .update({ status: poStatus, updated_at: new Date().toISOString() })
      .eq('id', poId);

    // Update Inventory for each received item (damaged items are NOT added to available stock)
    for (const item of items) {
      if (item.receivedQty > 0 && item.productId) {
        try {
          await inventoryLedger.addStock(item.productId, item.receivedQty, `GRN: ${grnNumber}`, userId || 'system');
        } catch (err: any) {
          logger.error(`Failed to update inventory for product ${item.productId}: ${err.message}`);
        }
      }
    }

    return transformRow(grnData);
  }

  async getGRNs(query: any = {}) {
    let q = supabase
      .from(GRN_TABLE)
      .select(`
        *,
        supplier:supplier_id (id, name, code),
        purchaseOrder:po_id (id, po_number),
        items:goods_receipt_note_items (*)
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
