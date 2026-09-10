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
  status: 'new_request' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  isWalkIn?: boolean;
  assignedTo?: string;
  assignedUser?: { id?: string; _id?: string; name: string; email: string; phone?: string; };
  imeiOrSerialNumber?: string;
  customerPhotoUrl?: string;
  devicePhotoUrl?: string;
  serviceCharges?: number;
  partsCharges?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid';
  invoiceNumber?: string;
  invoiceDate?: string;
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
    billingFields?: { serviceCharges?: number; partsCharges?: number; totalAmount?: number; paymentMethod?: string; paymentStatus?: string; },
    assignedTo?: string
  ): Promise<ServiceRequest> => {
    const { data } = await apiClient.patch<ApiResponse<ServiceRequest>>(
      `/admin/service-requests/${id}/status`,
      { status, adminNotes, finalPrice, assignedTo, ...billingFields },
    );
    return data.data;
  },
  createWalkIn: async (requestData: any): Promise<ServiceRequest> => {
    // Send to public route with walk-in flags
    const { data } = await apiClient.post<ApiResponse<ServiceRequest>>('/service-requests', {
      ...requestData,
      isWalkIn: true
    });
    return data.data;
  },
  uploadPhotos: async (formData: FormData): Promise<{ customerPhotoUrl?: string; devicePhotoUrl?: string }> => {
    // Hit the public router that has the multer config
    const { data } = await apiClient.post<ApiResponse<any>>('/service-requests/upload-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },
  downloadInvoice: async (id: string, invoiceNumber: string = 'invoice'): Promise<void> => {
    const response = await apiClient.get(`/service-requests/${id}/invoice`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SR-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/service-requests/${id}`);
  },
  getStats: async (): Promise<ServiceStats> => {
    const { data } = await apiClient.get<ApiResponse<ServiceStats>>('/admin/service-requests/stats');
    return data.data;
  },
};
