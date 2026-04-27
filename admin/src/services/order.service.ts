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
  downloadInvoice: async (id: string, orderNumber?: string): Promise<void> => {
    const response = await apiClient.get(`/admin/orders/${id}/invoice`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${orderNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
