import apiClient from '@/lib/api-client';
import type { ApiResponse, Order, OrdersResponse, OrderStatus, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const orderService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<OrdersResponse> => {
    const { data } = await apiClient.get<ApiResponse<OrdersResponse>>(
      `/admin/orders?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  getById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return data.data;
  },
  updateStatus: async (id: string, status: OrderStatus, message?: string): Promise<Order> => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
      orderStatus: status,
      message,
    });
    return data.data;
  },
  processRefund: async (id: string, reason: string): Promise<Order> => {
    const { data } = await apiClient.post<ApiResponse<Order>>(`/admin/orders/${id}/refund`, {
      reason,
    });
    return data.data;
  },
  updateTracking: async (id: string, tracking: {
    trackingNumber?: string;
    trackingUrl?: string;
    logisticsPartner?: string;
    estimatedDelivery?: string;
  }): Promise<Order> => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/admin/orders/${id}/tracking`, tracking);
    return data.data;
  },
};
