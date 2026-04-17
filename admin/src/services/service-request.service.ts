import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import { buildQueryString } from '@/lib/utils';

export interface ServiceRequest {
  _id: string;
  requestNumber: string;
  user?: { _id: string; name: string; email: string };
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceBrand: string;
  deviceModel: string;
  serviceType: string;
  description: string;
  estimatedPrice?: number;
  finalPrice?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestsResponse {
  requests: ServiceRequest[];
  totalRequests: number;
  totalPages: number;
  currentPage: number;
}

export interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export const serviceRequestService = {
  getAll: async (filters: Record<string, string | number | undefined> = {}): Promise<ServiceRequestsResponse> => {
    const { data } = await apiClient.get<ApiResponse<ServiceRequestsResponse>>(
      `/admin/service-requests?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  getById: async (id: string): Promise<ServiceRequest> => {
    const { data } = await apiClient.get<ApiResponse<ServiceRequest>>(`/admin/service-requests/${id}`);
    return data.data;
  },
  updateStatus: async (
    id: string,
    status: string,
    adminNotes?: string,
    finalPrice?: number,
  ): Promise<ServiceRequest> => {
    const { data } = await apiClient.patch<ApiResponse<ServiceRequest>>(
      `/admin/service-requests/${id}/status`,
      { status, adminNotes, finalPrice },
    );
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/service-requests/${id}`);
  },
  getStats: async (): Promise<ServiceStats> => {
    const { data } = await apiClient.get<ApiResponse<ServiceStats>>('/admin/service-requests/stats');
    return data.data;
  },
};
