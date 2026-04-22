import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

const router = Router();
router.use(authenticate, isAdmin);

// ====== GET all RFQs ======
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let qb = supabase
      .from('rfqs')
      .select('*, suppliers:supplier_id(id, name, email)', { count: 'exact' });

    if (status) qb = qb.eq('status', status);
    if (search) qb = qb.ilike('rfq_number', `%${search}%`);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const rfqs = (data || []).map((r: any) => {
      const t = transformRow(r);
      if (t.suppliers) { t.supplier = t.suppliers; delete t.suppliers; }
      return t;
    });

    sendSuccess(res, { rfqs, total: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page }, 'RFQs fetched');
  } catch (error) {
    next(error);
  }
});

// ====== GET single RFQ ======
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('rfqs')
      .select('*, suppliers:supplier_id(id, name, email, phone)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('RFQ');
    const t = transformRow(data);
    if (t.suppliers) { t.supplier = t.suppliers; delete t.suppliers; }
    sendSuccess(res, t, 'RFQ fetched');
  } catch (error) {
    next(error);
  }
});

// ====== CREATE RFQ ======
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { supplierId, items, notes, expectedDeliveryDate, deliveryAddress } = req.body;

    if (!supplierId || !items?.length) {
      res.status(400).json({ success: false, message: 'supplierId and items are required' });
      return;
    }

    // Generate RFQ number
    const { count } = await supabase.from('rfqs').select('id', { count: 'exact', head: true });
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('rfqs')
      .insert({
        rfq_number: rfqNumber,
        supplier_id: supplierId,
        items: items,
        notes: notes || null,
        expected_delivery_date: expectedDeliveryDate || null,
        delivery_address: deliveryAddress || null,
        status: 'sent',
      })
      .select('*, suppliers:supplier_id(id, name, email)')
      .single();

    if (error) throw error;

    const t = transformRow(data);
    if (t.suppliers) { t.supplier = t.suppliers; delete t.suppliers; }
    sendCreated(res, t, 'RFQ created successfully');
  } catch (error) {
    next(error);
  }
});

// ====== UPDATE RFQ (status / supplier response) ======
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, supplierQuote, supplierNotes, quotedAt } = req.body;
    const updates: any = {};
    if (status) updates.status = status;
    if (supplierQuote !== undefined) updates.supplier_quote = supplierQuote;
    if (supplierNotes !== undefined) updates.supplier_notes = supplierNotes;
    if (quotedAt !== undefined) updates.quoted_at = quotedAt;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rfqs')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, suppliers:supplier_id(id, name, email)')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('RFQ');
    const t = transformRow(data);
    if (t.suppliers) { t.supplier = t.suppliers; delete t.suppliers; }
    sendSuccess(res, t, 'RFQ updated');
  } catch (error) {
    next(error);
  }
});

// ====== DELETE RFQ ======
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase.from('rfqs').delete().eq('id', req.params.id);
    if (error) throw error;
    sendMessage(res, 'RFQ deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
