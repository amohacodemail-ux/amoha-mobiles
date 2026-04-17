import apiClient from '@/lib/api-client';

export interface ServiceRequestData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceBrand: string;
  deviceModel: string;
  serviceType: string;
  description?: string;
}

export interface ServiceRequest {
  _id: string;
  requestNumber: string;
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

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const serviceRequestService = {
  async submit(data: ServiceRequestData): Promise<ServiceRequest> {
    const res = await apiClient.post('/service-requests', data);
    return res.data.data;
  },
  async getMyRequests(): Promise<ServiceRequest[]> {
    const res = await apiClient.get('/service-requests/my-requests');
    return res.data.data;
  },
};

export const contactService = {
  async submit(data: ContactFormData) {
    const res = await apiClient.post('/contact', data);
    return res.data;
  },
};
