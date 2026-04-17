import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import { buildQueryString } from '@/lib/utils';

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessagesResponse {
  messages: ContactMessage[];
  totalMessages: number;
  totalPages: number;
  currentPage: number;
}

export const contactService = {
  getAll: async (filters: Record<string, string | number | undefined> = {}): Promise<ContactMessagesResponse> => {
    const { data } = await apiClient.get<ApiResponse<ContactMessagesResponse>>(
      `/admin/contact-messages?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  markRead: async (id: string): Promise<ContactMessage> => {
    const { data } = await apiClient.patch<ApiResponse<ContactMessage>>(`/admin/contact-messages/${id}/read`);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/contact-messages/${id}`);
  },
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/admin/contact-messages/unread-count');
    return data.data.count;
  },
};
