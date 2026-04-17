import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import { buildQueryString } from '@/lib/utils';

export interface CrmCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  segment: 'vip' | 'loyal' | 'regular' | 'new';
  notesCount: number;
}

export interface CrmNote {
  _id: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'follow_up';
  content: string;
  author: { _id: string; name: string };
  createdAt: string;
}

export interface CrmCustomerProfile {
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: string;
    avatar?: string;
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    segment: string;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  notes: CrmNote[];
}

export interface SegmentSummary {
  segment: string;
  count: number;
  totalRevenue: number;
}

export interface CrmCustomersResponse {
  customers: CrmCustomer[];
  total: number;
  page: number;
  totalPages: number;
}

export const crmService = {
  getCustomers: async (params: { page?: number; limit?: number; search?: string; segment?: string } = {}): Promise<CrmCustomersResponse> => {
    const { data } = await apiClient.get<ApiResponse<CrmCustomersResponse>>(
      `/admin/crm/customers?${buildQueryString(params)}`,
    );
    return data.data;
  },

  getCustomerProfile: async (customerId: string): Promise<CrmCustomerProfile> => {
    const { data } = await apiClient.get<ApiResponse<CrmCustomerProfile>>(
      `/admin/crm/customers/${customerId}`,
    );
    return data.data;
  },

  addNote: async (customerId: string, payload: { type: string; content: string }): Promise<CrmNote> => {
    const { data } = await apiClient.post<ApiResponse<CrmNote>>(
      `/admin/crm/customers/${customerId}/notes`,
      payload,
    );
    return data.data;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    await apiClient.delete(`/admin/crm/notes/${noteId}`);
  },

  getSegmentSummary: async (): Promise<SegmentSummary[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/crm/segments');
    const raw = data?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.segments) ? raw.segments : [];
  },
};
