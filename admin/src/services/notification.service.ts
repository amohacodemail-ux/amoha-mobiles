import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface Notification {
  _id: string;
  type: 'order' | 'contact' | 'service_request' | 'kyc' | 'review' | 'system' | 'low_stock';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalNotifications: number;
  totalPages: number;
  currentPage: number;
}

export interface RecentNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationService = {
  getAll: async (page = 1, limit = 20, type?: string): Promise<NotificationsResponse> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    const { data } = await apiClient.get<ApiResponse<NotificationsResponse>>(`/admin/notifications?${params}`);
    return data.data;
  },

  getRecent: async (): Promise<RecentNotificationsResponse> => {
    const { data } = await apiClient.get<ApiResponse<RecentNotificationsResponse>>('/admin/notifications/recent');
    return data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/admin/notifications/unread-count');
    return data.data.count;
  },

  markRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch<ApiResponse<Notification>>(`/admin/notifications/${id}/read`);
    return data.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/admin/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/admin/notifications/clear');
  },
};
