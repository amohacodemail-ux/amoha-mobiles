import { Router, Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { ForbiddenError, NotFoundError } from '../errors/app-error';

const router = Router();

// All sales routes require authentication
router.use(authenticate);

// Only admin and sales can access these routes
const canAccessSalesModules = authorize('admin', 'sales');

// ============================================================
// HELPER: Validate ownership â€” sales can only touch own data
// ============================================================
function enforceSalesOwnership(req: AuthenticatedRequest, ownerId: string) {
  const role = req.user?.role;
  const userId = req.user?.userId;
  if (role === 'admin') return; // admin sees all
  if (userId !== ownerId) {
    throw new ForbiddenError('You can only access your own data');
  }
}

// ============================================================
// DAILY ACTIVITIES
// ============================================================

/**
 * GET /api/sales/daily-activities
 * Sales: returns own activities only. Admin: can pass ?userId= to filter.
 */
router.get('/daily-activities', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const dateFilter = req.query.date as string;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase
      .from('daily_activities')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .order('activity_date', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    if (dateFilter) {
      query = query.eq('activity_date', dateFilter);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    sendSuccess(res, {
      activities: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Daily activities fetched');
  } catch (error) { next(error); }
});

/**
 * POST /api/sales/daily-activities
 * Creates an activity for the authenticated sales user.
 */
router.post('/daily-activities', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const { activityDate, customerName, visitType, location, notes, status, productsDemoed, orderValue } = req.body;

    const { data, error } = await supabase
      .from('daily_activities')
      .insert({
        user_id: userId,
        activity_date: activityDate || new Date().toISOString().split('T')[0],
        customer_name: customerName || '',
        visit_type: visitType || 'productive',
        location: location || '',
        notes: notes || '',
        status: status || 'completed',
        products_demoed: productsDemoed || '',
        order_value: orderValue || 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    sendCreated(res, transformRow(data), 'Activity recorded');
  } catch (error) { next(error); }
});

/**
 * PATCH /api/sales/daily-activities/:id
 * Update own activity only.
 */
router.patch('/daily-activities/:id', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('daily_activities')
      .select('user_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new NotFoundError('Activity');
    enforceSalesOwnership(req, existing.user_id);

    // Explicitly map camelCase → snake_case (Supabase requires snake_case)
    const { activityDate, customerName, visitType, location, notes, status, productsDemoed, orderValue } = req.body;
    const updatePayload: Record<string, any> = {};
    if (activityDate !== undefined) updatePayload.activity_date = activityDate;
    if (customerName !== undefined) updatePayload.customer_name = customerName;
    if (visitType !== undefined) updatePayload.visit_type = visitType;
    if (location !== undefined) updatePayload.location = location;
    if (notes !== undefined) updatePayload.notes = notes;
    if (status !== undefined) updatePayload.status = status;
    if (productsDemoed !== undefined) updatePayload.products_demoed = productsDemoed;
    if (orderValue !== undefined) updatePayload.order_value = orderValue;

    const { data, error } = await supabase
      .from('daily_activities')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), 'Activity updated');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/daily-activities/:id/approve - admin approve/reject */
router.patch('/daily-activities/:id/approve', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) throw new ValidationError('approvalStatus must be approved or rejected');
    if (approvalStatus === 'rejected' && !rejectionReason) throw new ValidationError('rejectionReason is required when rejecting');
    const { data, error } = await supabase
      .from('daily_activities')
      .update({
        approval_status: approvalStatus,
        rejection_reason: rejectionReason || null,
        approved_by: req.user!.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), `Activity ${approvalStatus}`);
  } catch (error) { next(error); }
});

// ============================================================
// TOUR PLAN / MY DAY PLAN
// ============================================================

router.get('/tour-plans', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase
      .from('tour_plans')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .order('plan_date', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    sendSuccess(res, {
      plans: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Tour plans fetched');
  } catch (error) { next(error); }
});

router.post('/tour-plans', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const { planDate, title, areas, plannedVisits, notes, status } = req.body;

    const { data, error } = await supabase
      .from('tour_plans')
      .insert({
        user_id: userId,
        plan_date: planDate || new Date().toISOString().split('T')[0],
        title: title || 'My Day Plan',
        areas: areas || '',
        planned_visits: plannedVisits || 0,
        notes: notes || '',
        status: status || 'planned',
      })
      .select('*')
      .single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Tour plan created');
  } catch (error) { next(error); }
});

router.patch('/tour-plans/:id', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const { data: existing, error: fetchErr } = await supabase
      .from('tour_plans')
      .select('user_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new NotFoundError('Tour plan');
    enforceSalesOwnership(req, existing.user_id);

    // Explicitly map camelCase → snake_case (Supabase requires snake_case)
    const { planDate, title, areas, plannedVisits, completedVisits, notes, status } = req.body;
    const updatePayload: Record<string, any> = {};
    if (planDate !== undefined) updatePayload.plan_date = planDate;
    if (title !== undefined) updatePayload.title = title;
    if (areas !== undefined) updatePayload.areas = areas;
    if (plannedVisits !== undefined) updatePayload.planned_visits = plannedVisits;
    if (completedVisits !== undefined) updatePayload.completed_visits = completedVisits;
    if (notes !== undefined) updatePayload.notes = notes;
    if (status !== undefined) updatePayload.status = status;

    const { data, error } = await supabase
      .from('tour_plans')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), 'Tour plan updated');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/tour-plans/:id/approve - admin approve/reject */
router.patch('/tour-plans/:id/approve', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) throw new ValidationError('approvalStatus must be approved or rejected');
    if (approvalStatus === 'rejected' && !rejectionReason) throw new ValidationError('rejectionReason is required when rejecting');
    const { data, error } = await supabase
      .from('tour_plans')
      .update({
        approval_status: approvalStatus,
        rejection_reason: rejectionReason || null,
        approved_by: req.user!.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), `Tour plan ${approvalStatus}`);
  } catch (error) { next(error); }
});

// ============================================================
// TARGETS (view only for sales)
// ============================================================

router.get('/targets', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const userId = role === 'admin' && req.query.userId
      ? req.query.userId as string
      : req.user!.userId;

    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const { data, error } = await supabase
      .from('sales_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw error;

    // Also fetch YTD targets for this year
    const { data: ytdData } = await supabase
      .from('sales_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('month', { ascending: true });

    sendSuccess(res, {
      currentTarget: data ? transformRow(data) : null,
      yearlyTargets: (ytdData || []).map(transformRow),
    }, 'Targets fetched');
  } catch (error) { next(error); }
});

// Admin-only: set/update targets for a sales user
router.post('/targets', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const { userId, month, year, targetAmount, targetCount, notes } = req.body;

    const { data, error } = await supabase
      .from('sales_targets')
      .upsert({
        user_id: userId,
        month,
        year,
        target_amount: targetAmount || 0,
        target_count: targetCount || 0,
        notes: notes || '',
        achieved_amount: 0,
        achieved_count: 0,
      }, { onConflict: 'user_id,month,year' })
      .select('*')
      .single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Target set');
  } catch (error) { next(error); }
});

// ============================================================
// EXPENSES
// ============================================================

router.get('/expenses', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase
      .from('expenses')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .is('speedometer_start', null)  // regular expenses only (not distance-entries)
      .order('expense_date', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    sendSuccess(res, {
      expenses: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Expenses fetched');
  } catch (error) { next(error); }
});

router.post('/expenses', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const { expenseDate, category, amount, description, receiptUrl, travelMode, distanceKm } = req.body;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        expense_date: expenseDate || new Date().toISOString().split('T')[0],
        category: category || 'travel',
        amount: parseFloat(amount) || 0,
        description: description || '',
        receipt_url: receiptUrl || '',
        travel_mode: travelMode || '',
        distance_km: distanceKm || 0,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Expense submitted');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/expenses/:id/approve - admin approve/reject expense */
router.patch('/expenses/:id/approve', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) throw new ValidationError('approvalStatus must be approved or rejected');
    if (approvalStatus === 'rejected' && !rejectionReason) throw new ValidationError('rejectionReason is required when rejecting');
    const { data, error } = await supabase
      .from('expenses')
      .update({
        status: approvalStatus,
        rejection_reason: rejectionReason || null,
        approved_by: req.user!.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), `Expense ${approvalStatus}`);
  } catch (error) { next(error); }
});

// ============================================================
// ATTENDANCE
// ============================================================

/** Compute working hours label from check-in/check-out timestamps (TIMESTAMPTZ ISO strings). */
function computeWorkingHours(checkIn: string | null | undefined, checkOut: string | null | undefined): string {
  if (!checkIn) return '-';
  if (!checkOut) return 'In Progress';
  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (!isFinite(diffMs) || diffMs < 0) return '-';
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hours ${minutes} minutes`;
}

router.get('/attendance', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 31;
    const offset = (page - 1) * limit;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase
      .from('sales_attendance')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .order('attendance_date', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    const rows = data || [];
    sendSuccess(res, {
      attendance: rows.map((r: any) => ({
        ...transformRow(r),
        workingHours: computeWorkingHours(r.check_in, r.check_out),
      })),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Attendance fetched');
  } catch (error) { next(error); }
});

/**
 * POST /api/sales/attendance/check-in
 * Mark attendance check-in for today.
 */
router.post('/attendance/check-in', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('sales_attendance')
      .select('id, check_in, check_out')
      .eq('user_id', userId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing?.check_in) {
      sendSuccess(res, { ...transformRow(existing), workingHours: computeWorkingHours(existing.check_in, existing.check_out) }, 'Already checked in for today');
      return;
    }

    const checkInTime = new Date().toISOString();
    const { data, error } = await supabase
      .from('sales_attendance')
      .upsert({
        user_id: userId,
        attendance_date: today,
        check_in: checkInTime,
        location_check_in: req.body.location || '',
        status: 'present',
      }, { onConflict: 'user_id,attendance_date' })
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, { ...transformRow(data), workingHours: computeWorkingHours(data.check_in, data.check_out) }, 'Checked in successfully');
  } catch (error) { next(error); }
});

/**
 * PATCH /api/sales/attendance/check-out
 * Mark check-out for today.
 */
router.patch('/attendance/check-out', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sales_attendance')
      .update({
        check_out: new Date().toISOString(),
        location_check_out: req.body.location || '',
      })
      .eq('user_id', userId)
      .eq('attendance_date', today)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, { ...transformRow(data), workingHours: computeWorkingHours(data.check_in, data.check_out) }, 'Checked out successfully');
  } catch (error) { next(error); }
});

// ============================================================
// LEAVE MANAGEMENT
// ============================================================

router.get('/leaves', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase
      .from('leave_requests')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    if (req.query.status) {
      query = query.eq('status', req.query.status as string);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    sendSuccess(res, {
      leaves: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Leave requests fetched');
  } catch (error) { next(error); }
});

router.post('/leaves', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const userId = req.user!.userId;
    const { fromDate, toDate, leaveType, reason, halfDay } = req.body;

    if (!fromDate || !toDate || !reason) {
      const { ValidationError } = await import('../errors/app-error');
      throw new ValidationError('fromDate, toDate, and reason are required');
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        from_date: fromDate,
        to_date: toDate,
        leave_type: leaveType || 'casual',
        reason,
        half_day: !!halfDay,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Leave request submitted');
  } catch (error) { next(error); }
});

// Admin-only: approve/reject leave
router.patch('/leaves/:id/status', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      const { ValidationError } = await import('../errors/app-error');
      throw new ValidationError('Status must be approved or rejected');
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: req.user!.userId,
        remarks: remarks || '',
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), `Leave ${status}`);
  } catch (error) { next(error); }
});

// ============================================================
// ADMIN PENDING REQUESTS (aggregate across all modules)
// ============================================================

/** GET /api/sales/admin/pending-requests - get all pending submissions across modules */
router.get('/admin/pending-requests', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const [activities, tourPlans, expenses, leaves] = await Promise.all([
      supabase.from('daily_activities')
        .select('*, user:user_id(id,name,email)')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('tour_plans')
        .select('*, user:user_id(id,name,email)')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('expenses')
        .select('*, user:user_id(id,name,email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('leave_requests')
        .select('*, user:user_id(id,name,email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    sendSuccess(res, {
      activities: (activities.data || []).map(transformRow),
      tourPlans: (tourPlans.data || []).map(transformRow),
      expenses: (expenses.data || []).map(transformRow),
      leaves: (leaves.data || []).map(transformRow),
      totalPending:
        (activities.data?.length || 0) +
        (tourPlans.data?.length || 0) +
        (expenses.data?.length || 0) +
        (leaves.data?.length || 0),
    }, 'Pending requests fetched');
  } catch (error) { next(error); }
});

// ============================================================
// GEO-TAG / GEO-FENCE
// ============================================================

/** Haversine distance between two coordinates in meters */
function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(la2 - la1);
  const dLng = r(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GEO_FENCE_VISIT_TYPES = ['productive', 'non_productive', 'office', 'travel', 'other'];

function isValidLat(lat: number): boolean {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

function isValidCoords(lat: number, lng: number): boolean {
  return isValidLat(lat) && isValidLng(lng);
}

/** Resolve an assigned salesperson id — returns null when unassigned/cleared, throws when invalid */
async function resolveAssignedUserId(assignedUserId: any): Promise<string | null> {
  const { ValidationError } = await import('../errors/app-error');
  if (assignedUserId === undefined || assignedUserId === null || assignedUserId === '') return null;
  const supabase = (await import('../config/supabase')).default;
  const { data: target, error } = await supabase.from('users').select('id, role').eq('id', assignedUserId).maybeSingle();
  if (error) throw error;
  if (!target) throw new ValidationError('Assigned salesperson does not exist');
  if (target.role !== 'sales') throw new ValidationError('Only sales users can be assigned to a geo-fence');
  return assignedUserId;
}

/** GET /api/sales/geo-fences - list active geo-fence zones. Admin sees all; sales see only their own assigned territories. */
router.get('/geo-fences', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    let query = supabase
      .from('geo_fences')
      .select('*, assigned_user:assigned_user_id(id,name,email)')
      .eq('is_active', true);
    // Sales users must never see other salespersons' territories.
    if (req.user?.role !== 'admin') {
      query = query.eq('assigned_user_id', req.user!.userId);
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, (data || []).map(transformRow), 'Geo-fences fetched');
  } catch (error) { next(error); }
});

/** GET /api/sales/geo-fences/mine - all active geo-fence territories assigned to the logged-in salesperson */
router.get('/geo-fences/mine', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { data, error } = await supabase
      .from('geo_fences')
      .select('*, assigned_user:assigned_user_id(id,name,email)')
      .eq('assigned_user_id', req.user!.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    sendSuccess(res, (data || []).map(transformRow), 'Assigned geo-fences fetched');
  } catch (error) { next(error); }
});

/** POST /api/sales/geo-fences - create geo-fence zone (admin only) */
router.post('/geo-fences', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { name, centerLat, centerLng, radiusMeters, description, assignedUserId } = req.body;
    if (!name || centerLat === undefined || centerLng === undefined) throw new ValidationError('name, centerLat, and centerLng are required');
    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const radius = parseInt(radiusMeters, 10) || 500;
    if (!isValidCoords(lat, lng)) throw new ValidationError('centerLat must be between -90 and 90, centerLng between -180 and 180');
    if (radius < 10) throw new ValidationError('radiusMeters must be at least 10');
    const resolvedAssigned = await resolveAssignedUserId(assignedUserId);
    const { data, error } = await supabase.from('geo_fences').insert({
      name,
      description: description || '',
      center_lat: lat,
      center_lng: lng,
      radius_meters: radius,
      is_active: true,
      assigned_user_id: resolvedAssigned,
      created_by: req.user!.userId,
    }).select('*').single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Geo-fence created');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/geo-fences/:id - update geo-fence (admin only) */
router.patch('/geo-fences/:id', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow, toDbRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const allowed = ['name', 'description', 'centerLat', 'centerLng', 'radiusMeters', 'isActive', 'assignedUserId'];
    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.centerLat !== undefined && !isValidLat(parseFloat(patch.centerLat))) throw new ValidationError('centerLat must be between -90 and 90');
    if (patch.centerLng !== undefined && !isValidLng(parseFloat(patch.centerLng))) throw new ValidationError('centerLng must be between -180 and 180');
    if (patch.radiusMeters !== undefined && parseInt(patch.radiusMeters, 10) < 10) throw new ValidationError('radiusMeters must be at least 10');
    if (patch.assignedUserId !== undefined) patch.assignedUserId = await resolveAssignedUserId(patch.assignedUserId);
    const dbPatch = toDbRow(patch);
    const { data, error } = await supabase.from('geo_fences').update(dbPatch).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), 'Geo-fence updated');
  } catch (error) { next(error); }
});

/** DELETE /api/sales/geo-fences/:id - delete geo-fence (admin only). Existing geo-tags keep history (fence_id set to NULL). */
router.delete('/geo-fences/:id', authorize('admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { NotFoundError } = await import('../errors/app-error');
    const { data: existing, error: findError } = await supabase.from('geo_fences').select('id').eq('id', req.params.id).maybeSingle();
    if (findError) throw findError;
    if (!existing) throw new NotFoundError('Geo-fence');
    const { error } = await supabase.from('geo_fences').delete().eq('id', req.params.id);
    if (error) throw error;
    sendSuccess(res, null, 'Geo-fence deleted');
  } catch (error) { next(error); }
});

/** POST /api/sales/geo-tag/validate - check lat/lng against the logged-in salesperson's own assigned geo-fence */
router.post('/geo-tag/validate', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError, ForbiddenError } = await import('../errors/app-error');
    const { latitude, longitude, fenceId } = req.body;
    if (latitude === undefined || longitude === undefined) throw new ValidationError('latitude and longitude are required');
    const lat = parseFloat(latitude); const lng = parseFloat(longitude);
    if (!isValidCoords(lat, lng)) throw new ValidationError('Valid latitude (-90 to 90) and longitude (-180 to 180) are required');
    // Only zones assigned to the authenticated salesperson are ever considered.
    // A salesperson cannot check/validate another salesperson's territory.
    const userId = req.user!.userId;
    const { data: fences, error } = await supabase
      .from('geo_fences')
      .select('*, assigned_user:assigned_user_id(id,name,email)')
      .eq('is_active', true)
      .eq('assigned_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (!fences || fences.length === 0) {
      return sendSuccess(res, {
        inFence: false,
        fence: null,
        latitude: lat,
        longitude: lng,
        assignedFence: null,
        assignedInFence: null,
        distanceToAssigned: null,
      }, 'No geo-fence territory has been assigned to you yet');
    }

    // Validate against a specific selected assigned territory when provided.
    let target: any = fences[0];
    if (fenceId) {
      const match = (fences as any[]).find(f => f.id === fenceId);
      if (!match) throw new ForbiddenError('You can only check geo-fences assigned to you');
      target = match;
    }

    const distance = Math.round(haversine(lat, lng, target.center_lat, target.center_lng));
    const inFence = distance <= target.radius_meters;
    sendSuccess(res, {
      inFence,
      fence: transformRow(target),
      latitude: lat,
      longitude: lng,
      assignedFence: transformRow(target),
      assignedInFence: inFence,
      distanceToAssigned: distance,
    }, inFence ? 'Within geo-fence' : 'Outside geo-fence');
  } catch (error) { next(error); }
});

/** POST /api/sales/geo-tags - save a GPS geo-tag. Sales role only (admin monitors, does not capture). */
router.post('/geo-tags', authorize('sales'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError, ForbiddenError } = await import('../errors/app-error');
    const { latitude, longitude, accuracyMeters, address, visitType, fenceId } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (latitude === undefined || longitude === undefined || !isValidCoords(lat, lng)) {
      throw new ValidationError('Valid latitude (-90 to 90) and longitude (-180 to 180) are required');
    }
    const type = GEO_FENCE_VISIT_TYPES.includes(visitType) ? visitType : 'other';
    const accuracy = accuracyMeters !== undefined && accuracyMeters !== null && !isNaN(parseFloat(accuracyMeters))
      ? parseFloat(accuracyMeters)
      : null;

    const userId = req.user!.userId;

    // Salesperson name snapshot
    const { data: user, error: userErr } = await supabase.from('users').select('id, name, email').eq('id', userId).maybeSingle();
    if (userErr) throw userErr;

    // Resolve the assigned territory for this capture.
    // If the frontend selects a territory, we must verify it is actually assigned
    // to the authenticated salesperson — never trust a client-supplied fence ID.
    let fenceRef: any = null;
    if (fenceId) {
      const { data: fence, error: fenceErr } = await supabase.from('geo_fences').select('*').eq('id', fenceId).maybeSingle();
      if (fenceErr) throw fenceErr;
      if (!fence) throw new ValidationError('The selected geo-fence does not exist');
      if (!fence.is_active) throw new ValidationError('The selected geo-fence is inactive');
      if (fence.assigned_user_id !== userId) throw new ForbiddenError('You can only save your location against geo-fences assigned to you');
      fenceRef = fence;
    } else {
      // No territory selected — fall back to this user's first active assigned fence.
      const { data: fences, error: fencesErr } = await supabase
        .from('geo_fences')
        .select('*')
        .eq('is_active', true)
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (fencesErr) throw fencesErr;
      fenceRef = (fences && fences[0]) || null;
    }

    // Compute fence status server-side (never trust client coords/status).
    let inFence: boolean | null = null;
    let distanceMeters: number | null = null;
    if (fenceRef) {
      distanceMeters = Math.round(haversine(lat, lng, fenceRef.center_lat, fenceRef.center_lng));
      inFence = distanceMeters <= fenceRef.radius_meters;
    }

    const { data, error } = await supabase.from('geo_tags').insert({
      user_id: userId,
      user_name: user?.name || user?.email || '',
      latitude: lat,
      longitude: lng,
      accuracy_meters: accuracy,
      address: address || '',
      visit_type: type,
      fence_id: fenceRef?.id || null,
      fence_name: fenceRef?.name || '',
      fence_center_lat: fenceRef?.center_lat ?? null,
      fence_center_lng: fenceRef?.center_lng ?? null,
      fence_radius_meters: fenceRef?.radius_meters ?? null,
      in_fence: inFence,
      distance_meters: distanceMeters,
    }).select('*').single();
    if (error) {
      const errCode = (error as any)?.code || '';
      const errMsg = String((error as any)?.message || error.message || '');
      if (errCode === 'PGRST205' || errMsg.includes('geo_tags') || errMsg.includes('relation "public.geo_tags"')) {
        throw new ValidationError('Location history table (geo_tags) is not set up yet. Please ask an administrator to run the Geo-Tag database migration (supabase-migration-geo-tag.sql), then try again.');
      }
      throw error;
    }
    const statusMessage = inFence === true
      ? 'Location saved - inside geo-fence'
      : inFence === false
        ? 'Location saved - outside geo-fence'
        : 'Location saved - no matching geo-fence';
    sendCreated(res, transformRow(data), statusMessage);
  } catch (error) { next(error); }
});

/** GET /api/sales/geo-tags - location history. Sales: own only. Admin: all, filterable by userId/date */
router.get('/geo-tags', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');

    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const dateFilter = req.query.date as string;
    const userIdFilter = req.query.userId as string;

    let query = supabase
      .from('geo_tags')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    if (dateFilter) {
      const dayStart = `${dateFilter}T00:00:00.000Z`;
      const dayEnd = new Date(new Date(dayStart).getTime() + 86400000).toISOString();
      query = query.gte('created_at', dayStart).lt('created_at', dayEnd);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    sendSuccess(res, {
      tags: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    }, 'Geo-tags fetched');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/daily-activities/:id/location - store GPS with an activity */
router.patch('/daily-activities/:id/location', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) throw new ValidationError('latitude and longitude are required');
    const { data: existing, error: fetchErr } = await supabase.from('daily_activities').select('user_id').eq('id', req.params.id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new NotFoundError('Activity');
    enforceSalesOwnership(req, existing.user_id);
    const { data, error } = await supabase.from('daily_activities').update({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), 'Location saved');
  } catch (error) { next(error); }
});

/** PATCH /api/sales/attendance/location - store GPS for today's attendance */
router.patch('/attendance/location', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const { latitude, longitude, type } = req.body;
    if (latitude === undefined || longitude === undefined) throw new ValidationError('latitude and longitude are required');
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];
    const payload = type === 'checkout' ? { checkout_latitude: parseFloat(latitude), checkout_longitude: parseFloat(longitude) } : { checkin_latitude: parseFloat(latitude), checkin_longitude: parseFloat(longitude) };
    const { data, error } = await supabase.from('sales_attendance').update(payload).eq('user_id', userId).eq('attendance_date', today).select('*').single();
    if (error) throw error;
    sendSuccess(res, transformRow(data), 'Attendance location saved');
  } catch (error) { next(error); }
});

// ============================================================
// DISTANCE CALCULATION
// ============================================================

/** POST /api/sales/distance-entries - log speedometer-based travel expense */
router.post('/distance-entries', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { ValidationError } = await import('../errors/app-error');
    const userId = req.user!.userId;
    const { expenseDate, description, travelMode, speedometerStart, speedometerEnd, speedometerPhotoUrl, amount } = req.body;
    if (speedometerStart === undefined || speedometerEnd === undefined) throw new ValidationError('speedometerStart and speedometerEnd are required');
    const start = parseInt(speedometerStart); const end = parseInt(speedometerEnd);
    if (end < start) throw new ValidationError('Speedometer end reading cannot be less than start reading');
    const distanceKm = Math.round((end - start) * 100) / 100;
    const { data, error } = await supabase.from('expenses').insert({ user_id: userId, expense_date: expenseDate || new Date().toISOString().split('T')[0], category: 'travel', amount: parseFloat(amount) || 0, description: description || `Travel: ${start} to ${end} km`, travel_mode: travelMode || '', distance_km: distanceKm, speedometer_start: start, speedometer_end: end, speedometer_photo_url: speedometerPhotoUrl || '', status: 'pending' }).select('*').single();
    if (error) throw error;
    sendCreated(res, transformRow(data), 'Distance entry recorded');
  } catch (error) { next(error); }
});

/** GET /api/sales/distance-entries - fetch speedometer travel expenses */
router.get('/distance-entries', canAccessSalesModules, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Admin with no ?userId= sees ALL records; admin with ?userId= filters; sales sees own only
    let query = supabase.from('expenses')
      .select('*, user:user_id(id,name,email)', { count: 'exact' })
      .eq('category', 'travel')
      .not('speedometer_start', 'is', null)
      .order('expense_date', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('user_id', req.user!.userId);
    } else if (req.query.userId) {
      query = query.eq('user_id', req.query.userId as string);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    sendSuccess(res, { entries: (data || []).map(transformRow), total: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page }, 'Distance entries fetched');
  } catch (error) { next(error); }
});

export default router;

