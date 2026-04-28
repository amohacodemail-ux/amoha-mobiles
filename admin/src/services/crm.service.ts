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
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/admin/crm/customers/${customerId}`,
    );
    const raw = data.data;

    // Normalise both old shape { customer, orders:{data,total}, notes, totalSpent }
    // and new shape { customer, stats, recentOrders, notes }
    const customer = raw?.customer ?? {};
    const ordersData: any[] = raw?.recentOrders ?? raw?.orders?.data ?? [];
    const notesData: any[] = Array.isArray(raw?.notes) ? raw.notes : [];
    const totalOrders = raw?.stats?.totalOrders ?? ordersData.length;
    const totalSpent  = raw?.stats?.totalSpent  ?? raw?.totalSpent ?? 0;
    const avgOrderValue = raw?.stats?.avgOrderValue ?? (totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0);

    const recentOrders = ordersData.map((o: any) => ({
      _id:         o._id ?? o.id,
      orderNumber: o.orderNumber ?? o.order_number ?? o._id ?? '',
      totalAmount: o.totalAmount ?? o.total ?? 0,
      status:      o.status ?? o.orderStatus ?? '',
      createdAt:   o.createdAt ?? o.created_at ?? '',
    }));

    const notes: CrmNote[] = notesData.map((n: any) => ({
      _id:     n._id ?? n.id,
      type:    n.type ?? 'note',
      content: n.content ?? n.note ?? '',
      author:  n.author ?? (n.authorId ? { _id: n.authorId, name: 'Admin' } : { _id: '', name: 'Admin' }),
      createdAt: n.createdAt ?? n.created_at ?? '',
    }));

    return {
      customer: {
        _id:       customer._id ?? customer.id ?? '',
        name:      customer.name ?? '',
        email:     customer.email ?? '',
        phone:     customer.phone,
        createdAt: customer.createdAt ?? customer.created_at ?? '',
        avatar:    customer.avatar,
      },
      stats: {
        totalOrders,
        totalSpent,
        avgOrderValue,
        segment: raw?.stats?.segment ?? 'new',
      },
      recentOrders,
      notes,
    };
  },

  addNote: async (customerId: string, payload: { type: string; content: string }): Promise<CrmNote> => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/admin/crm/customers/${customerId}/notes`,
      payload,
    );
    const n = data.data;
    return {
      _id:     n._id ?? n.id,
      type:    n.type ?? 'note',
      content: n.content ?? n.note ?? '',
      author:  n.author ?? (n.authorId ? { _id: n.authorId, name: 'Admin' } : { _id: '', name: 'Admin' }),
      createdAt: n.createdAt ?? n.created_at ?? '',
    };
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
