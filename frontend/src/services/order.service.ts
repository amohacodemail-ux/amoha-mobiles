import apiClient from '@/lib/api-client';
import type { Order, OrdersResponse, Address, ApiResponse, RazorpayOrderResponse } from '@/types';

export const orderService = {
  create: async (orderData: {
    shippingAddress: Address;
    paymentMethod: string;
    couponCode?: string;
  }): Promise<Order> => {
    const { data } = await apiClient.post<ApiResponse<Order>>(
      '/orders',
      orderData,
    );
    return data.data;
  },

  createRazorpayOrder: async (couponCode?: string): Promise<RazorpayOrderResponse> => {
    const { data } = await apiClient.post<ApiResponse<RazorpayOrderResponse>>(
      '/payment/create-order',
      { couponCode },
    );
    return data.data;
  },

  verifyPayment: async (verifyData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    shippingAddress: Address;
    couponCode?: string;
  }): Promise<Order> => {
    const { data } = await apiClient.post<ApiResponse<Order>>(
      '/payment/verify',
      verifyData,
    );
    return data.data;
  },

  getAll: async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    const { data } = await apiClient.get<ApiResponse<OrdersResponse>>(
      `/orders?page=${page}&limit=${limit}`,
    );
    return data.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(
      `/orders/${orderId}`,
    );
    return data.data;
  },

  cancel: async (orderId: string, reason: string): Promise<Order> => {
    const { data } = await apiClient.put<ApiResponse<Order>>(
      `/orders/${orderId}/cancel`,
      { reason },
    );
    return data.data;
  },

  trackOrder: async (orderId: string): Promise<Order> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(
      `/orders/${orderId}/track`,
    );
    return data.data;
  },

  // Public tracking for walk-in customers (no auth required)
  publicTrackOrder: async (orderNumber: string, phone: string): Promise<any> => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/orders/track/public?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`,
    );
    return data.data;
  },

  downloadInvoice: async (orderId: string): Promise<void> => {
    const response = await apiClient.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
