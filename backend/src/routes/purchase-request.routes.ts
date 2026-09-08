import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize, canAccessPurchase, canAccessAdminOnly } from '../middleware/role.middleware';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';
import { AuthenticatedRequest } from '../types';
import activityLog from '../services/activity-log.service';
import { generateSequentialPoNumber } from '../utils/po.util';
import { sendEmail } from '../utils/email.util';
const router = Router();
router.use(authenticate, canAccessPurchase);

// ====== GET all purchase requests ======
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let qb = supabase
      .from('purchase_requests')
      .select('*, requestor:requested_by(id, name, email), approver:approved_by(id, name, email)', { count: 'exact' });

    if (status) qb = qb.eq('status', status);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const requests = (data || []).map((r: any) => {
      const t = transformRow(r);
      if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
      if (t.approver) { t.approvedBy = t.approver; delete t.approver; }
      return t;
    });

    sendSuccess(res, { requests, total: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page }, 'Purchase requests fetched');
  } catch (error) {
    next(error);
  }
});

// ====== GET single purchase request ======
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*, requestor:requested_by(id, name, email), approver:approved_by(id, name, email)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Purchase Request');
    const t = transformRow(data);
    if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
    if (t.approver) { t.approvedBy = t.approver; delete t.approver; }
    sendSuccess(res, t, 'Purchase request fetched');
  } catch (error) {
    next(error);
  }
});

// ====== CREATE purchase request ======
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { items, reason, urgency, supplierId, notes } = req.body;

    if (!items?.length || !reason) {
      res.status(400).json({ success: false, message: 'items and reason are required' });
      return;
    }

    const { count } = await supabase.from('purchase_requests').select('id', { count: 'exact', head: true });
    const prNumber = `PR-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('purchase_requests')
      .insert({
        pr_number: prNumber,
        requested_by: req.user?.userId,
        items,
        reason,
        urgency: urgency || 'normal',
        notes: notes || null,
        supplier_id: supplierId || null,
        status: 'pending',
      })
      .select('*, requestor:requested_by(id, name, email)')
      .single();

    if (error) throw error;
    const t = transformRow(data);
    if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
    sendCreated(res, t, 'Purchase request created');
  } catch (error) {
    next(error);
  }
});

// ====== APPROVE Purchase Request ======
router.patch('/:id/approve', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'approved',
        approved_by: req.user?.userId,
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, requestor:requested_by(id, name, email), approver:approved_by(id, name, email)')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Purchase Request');
    const t = transformRow(data);
    if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
    if (t.approver) { t.approvedBy = t.approver; delete t.approver; }
    sendSuccess(res, t, 'Purchase request approved');
  } catch (error) {
    next(error);
  }
});

// ====== REJECT Purchase Request ======
router.patch('/:id/reject', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'rejected',
        approved_by: req.user?.userId,
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, requestor:requested_by(id, name, email)')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Purchase Request');
    const t = transformRow(data);
    if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
    sendSuccess(res, t, 'Purchase request rejected');
  } catch (error) {
    next(error);
  }
});

// ====== SUBMIT Purchase Request ======
router.patch('/:id/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('status', 'draft')
      .select('*, requestor:requested_by(id, name, email)')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Draft Purchase Request not found');
    
    const t = transformRow(data);
    if (t.requestor) { t.requestedBy = t.requestor; delete t.requestor; }
    sendSuccess(res, t, 'Purchase request submitted');
  } catch (error) {
    next(error);
  }
});

// ====== CONVERT to Purchase Order (after approval) ======
router.post('/:id/convert-to-po', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Fetch the PR
    const { data: pr, error: prError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (prError) throw prError;
    if (!pr) throw new NotFoundError('Purchase Request');
    if (pr.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Purchase request must be approved before converting to PO' });
      return;
    }

    const { expectedDeliveryDate, notes, supplierId } = req.body;
    const targetSupplierId = supplierId || pr.supplier_id;

    if (!targetSupplierId) {
      res.status(400).json({ success: false, message: 'supplierId is required to generate a PO' });
      return;
    }

    // Generate PO via unified utility
    const poNumber = await generateSequentialPoNumber();

    const poItems = (pr.items || []).map((item: any) => ({
      product_id: item.productId || null,
      product_name: item.name || item.productName || 'Item',
      sku: item.sku || '',
      quantity: item.quantity || 1,
      unit_price: item.unitPrice || 0,
      total_price: (item.quantity || 1) * (item.unitPrice || 0),
    }));

    const totalAmount = poItems.reduce((s: number, i: any) => s + i.total_price, 0);

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: targetSupplierId,
        purchase_request_id: pr.id,
        total_amount: totalAmount,
        expected_delivery: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
        notes: notes || pr.reason,
        status: 'sent',
      })
      .select('*')
      .single();

    if (poError) throw poError;

    // Ensure all items have a valid product_id. If missing, create a hidden draft product.
    // This avoids needing a product_name column on purchase_order_items.
    for (const item of poItems) {
      if (!item.product_id) {
        const { data: newProd } = await supabase.from('products').insert({
          name: item.product_name || 'Custom Product',
          slug: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          description: 'Custom product generated from purchase request',
          sku: item.sku || `CUSTOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: item.unit_price || 0,
          original_price: item.unit_price || 0,
          selling_price: item.unit_price || 0,
          stock: 0,
          is_active: false,
          thumbnail: 'placeholder.jpg'
        }).select('id').single();
        if (newProd) item.product_id = newProd.id;
      }
    }

    // Insert items into purchase_order_items (without product_name since it's on products table now)
    const poItemsToInsert = poItems.map((item: any) => ({
      purchase_order_id: po.id,
      product_id: item.product_id || null,
      quantity: item.quantity,
      unit_cost: item.unit_price,
      total_cost: item.total_price,
      pending_qty: item.quantity,
    })).filter((item: any) => item.product_id); // Only insert if we got a valid product ID

    if (poItemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItemsToInsert);
      if (itemsError) throw itemsError;
    }

    // Mark PR as converted
    await supabase
      .from('purchase_requests')
      .update({ status: 'converted', po_id: po.id, updated_at: new Date().toISOString() })
      .eq('id', pr.id);

    // Send email to supplier
    if (targetSupplierId) {
      const { data: supplier } = await supabase.from('suppliers').select('name, email').eq('id', targetSupplierId).maybeSingle();
      if (supplier?.email) {
        sendEmail({
          to: supplier.email,
          subject: `Purchase Order ${poNumber} - AMOHA Mobiles`,
          html: `<p>Dear ${supplier.name},</p><p>A new purchase order <strong>${poNumber}</strong> has been created for your review.</p><p>Total Amount: ₹${totalAmount.toLocaleString('en-IN')}</p><p>Please contact us if you have any questions.</p>`,
        }).catch(() => { }); // fire and forget
      }
    }

    sendCreated(res, transformRow(po), 'Purchase Order generated from Purchase Request');
  } catch (error) {
    next(error);
  }
});

// ====== UPDATE purchase request ======
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, reason, urgency, notes, supplierId } = req.body;
    const updates: any = { updated_at: new Date().toISOString() };
    if (items) updates.items = items;
    if (reason) updates.reason = reason;
    if (urgency) updates.urgency = urgency;
    if (notes !== undefined) updates.notes = notes;
    if (supplierId !== undefined) updates.supplier_id = supplierId;

    const { data, error } = await supabase
      .from('purchase_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Purchase Request');
    sendSuccess(res, transformRow(data), 'Purchase request updated');
  } catch (error) {
    next(error);
  }
});

// ====== DELETE purchase request ======
router.delete('/:id', canAccessAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prId = req.params.id;
    // Delete linked purchase request items first
    await supabase.from('purchase_request_items').delete().eq('purchase_request_id', prId);
    // Then delete the purchase request
    const { error } = await supabase.from('purchase_requests').delete().eq('id', prId);
    if (error) throw error;
    sendMessage(res, 'Purchase request deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
