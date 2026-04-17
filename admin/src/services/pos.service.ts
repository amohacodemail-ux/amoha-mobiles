import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface PosItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface PosOrderPayload {
  items: PosItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  posDiscount?: number;
  posDiscountType?: 'percentage' | 'fixed';
  notes?: string;
}

export interface PosOrderResult {
  order: any;
  billing: any;
  gstAmount: number;
  gstRate: number;
  invoiceNumber: string;
}

export interface PosTodayStats {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  totalGst: number;
  cashOrders: number;
  cardOrders: number;
  upiOrders: number;
  cashRevenue: number;
  cardRevenue: number;
  upiRevenue: number;
}

export interface PosBillingInfo {
  billing: {
    businessName: string;
    gstin: string;
    panNumber: string;
    stateCode: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingPincode: string;
    billingPhone: string;
    billingEmail: string;
    enableGst: boolean;
    gstRate: number;
    sacCode: string;
    hsnCode: string;
    termsOnInvoice: string;
    invoicePrefix: string;
    footerNote: string;
  };
  siteName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export const posService = {
  createOrder: async (payload: PosOrderPayload): Promise<PosOrderResult> => {
    const { data } = await apiClient.post<ApiResponse<PosOrderResult>>('/admin/pos/create-order', payload);
    return data.data;
  },
  getOrders: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const { data } = await apiClient.get<ApiResponse<{ orders: any[]; totalOrders: number; totalPages: number; currentPage: number }>>(
      `/admin/pos/orders?${query.toString()}`,
    );
    return data.data;
  },
  getTodayStats: async (): Promise<PosTodayStats> => {
    const { data } = await apiClient.get<ApiResponse<PosTodayStats>>('/admin/pos/today-stats');
    return data.data;
  },
  getBillingInfo: async (): Promise<PosBillingInfo> => {
    const { data } = await apiClient.get<ApiResponse<PosBillingInfo>>('/admin/pos/billing-info');
    return data.data;
  },
};
