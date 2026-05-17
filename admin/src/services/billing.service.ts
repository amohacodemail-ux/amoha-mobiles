import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import { downloadExcelFromBlob } from '@/lib/excel-export';

export interface BillingSummary {
  totalRevenue: number;
  totalOrders: number;
  totalGst: number;
  totalDiscount: number;
  onlineRevenue: number;
  posRevenue: number;
  onlineOrders: number;
  posOrders: number;
  avgOrderValue: number;
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
  period: string;
  startDate: string;
  endDate: string;
}

export interface BillingOrder {
  _id: string;
  id?: string;
  orderNumber: string;
  invoiceNumber?: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  totalAmount?: number;
  subtotal: number;
  discount: number;
  gstAmount?: number;
  gstRate?: number;
  isWalkIn: boolean;
  source: 'POS' | 'Online';
  customer: { name: string; email: string; phone: string };
  posPaymentMethod?: string;
  paymentMethod?: string;
}

export interface BillingOrdersResponse {
  orders: BillingOrder[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export type BillingPeriod = 'day' | 'week' | 'month' | 'custom';

export const billingService = {
  getSummary: async (params: {
    period?: BillingPeriod;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<BillingSummary> => {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    const { data } = await apiClient.get<ApiResponse<BillingSummary>>(
      `/admin/reports/sales-summary?${query.toString()}`,
    );
    return data.data;
  },

  getOrders: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    source?: 'online' | 'pos' | '';
    status?: string;
    search?: string;
  } = {}): Promise<BillingOrdersResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.source) query.set('source', params.source);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const { data } = await apiClient.get<ApiResponse<BillingOrdersResponse>>(
      `/admin/reports/orders?${query.toString()}`,
    );
    return data.data;
  },

  downloadInvoice: async (orderId: string, orderNumber?: string): Promise<void> => {
    const response = await apiClient.get(`/admin/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${orderNumber || orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadGstReport: async (params: {
    startDate?: string;
    endDate?: string;
    period?: BillingPeriod;
  } = {}): Promise<void> => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.period) query.set('period', params.period);
    query.set('format', 'csv');
    const response = await apiClient.get(`/admin/reports/gst-summary?${query.toString()}`, {
      responseType: 'blob',
    });
    const label = params.startDate ? params.startDate : new Date().toISOString().split('T')[0];
    await downloadExcelFromBlob(new Blob([response.data]), `GST-Report-${label}`);
  },
};
