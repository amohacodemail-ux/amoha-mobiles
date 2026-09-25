import api from './auth.service';

export interface PaymentTransaction {
  id: string;
  order_id: string | null;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  refund_id: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  refund_date: string | null;
  failure_reason: string | null;
  created_at: string;
  users?: {
    name: string;
    email: string;
    phone: string;
  };
  orders?: {
    order_number: string;
    total: number;
    created_at: string;
    status: string;
  };
}

export interface PaymentSummary {
  totalTransactions: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  totalSuccessfulAmount: number;
  totalRefundedAmount: number;
}

export const paymentHistoryService = {
  getSummary: async (params?: { from?: string; to?: string }) => {
    const response = await api.get('/admin/payment-history/summary', { params });
    return response.data;
  },

  getHistory: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentMethod?: string;
    from?: string;
    to?: string;
  }) => {
    const response = await api.get('/admin/payment-history', { params });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/admin/payment-history/${id}`);
    return response.data;
  }
};
