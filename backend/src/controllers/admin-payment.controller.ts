import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import { sendSuccess } from '../utils/response.util';
import logger from '../utils/logger.util';

class AdminPaymentController {
  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { search, status, paymentMethod, from, to } = req.query;

      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          users ( name, email, phone ),
          orders ( order_number, total, created_at, status )
        `, { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      
      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }

      if (from) {
        query = query.gte('created_at', from);
      }
      if (to) {
        query = query.lte('created_at', to);
      }

      if (search) {
        const searchStr = `%${search}%`;
        // PostgREST doesn't support complex OR across joined tables easily without RPC
        // We will just search on the transaction fields directly for now:
        query = query.or(`razorpay_payment_id.ilike.${searchStr},razorpay_order_id.ilike.${searchStr},customer_name.ilike.${searchStr},customer_email.ilike.${searchStr},customer_phone.ilike.${searchStr}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      sendSuccess(res, {
        transactions: data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: count ? Math.ceil(count / limit) : 0,
        }
      });
    } catch (error) {
      logger.error('Error fetching payment history', error);
      next(error);
    }
  }

  async getPaymentSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      
      let query = supabase.from('payment_transactions').select('amount, status, refund_amount');
      
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      
      const { data, error } = await query;
      if (error) throw error;

      let totalTransactions = 0;
      let successfulCount = 0;
      let failedCount = 0;
      let pendingCount = 0;
      let totalSuccessfulAmount = 0;
      let totalRefundedAmount = 0;

      for (const tx of data || []) {
        totalTransactions++;
        if (tx.status === 'success' || tx.status === 'partially_refunded' || tx.status === 'refunded') {
          successfulCount++;
          if (tx.status === 'success') {
            totalSuccessfulAmount += Number(tx.amount || 0);
          }
          totalRefundedAmount += Number(tx.refund_amount || 0);
        } else if (tx.status === 'failed') {
          failedCount++;
        } else if (tx.status === 'pending' || tx.status === 'created') {
          pendingCount++;
        }
      }

      sendSuccess(res, {
        totalTransactions,
        successfulCount,
        failedCount,
        pendingCount,
        totalSuccessfulAmount,
        totalRefundedAmount
      });
    } catch (error) {
      logger.error('Error fetching payment summary', error);
      next(error);
    }
  }

  async getPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          users ( name, email, phone ),
          orders ( order_number, total, created_at, status )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      sendSuccess(res, data);
    } catch (error) {
      logger.error('Error fetching payment details', error);
      next(error);
    }
  }
}

export default new AdminPaymentController();
