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
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid';
  status: 'new_request' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  invoiceNumber?: string;
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
    return res.data.data?.requests || res.data.data;
  },
  async getRequestById(id: string): Promise<ServiceRequest> {
    const res = await apiClient.get(`/service-requests/my-requests/${id}`);
    return res.data.data;
  },
  async downloadInvoice(id: string, invoiceNumber: string = 'invoice'): Promise<void> {
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
  async createPaymentOrder(id: string) {
    const res = await apiClient.post(`/service-requests/my-requests/${id}/create-payment-order`);
    return res.data.data;
  },
  async verifyPayment(id: string, paymentData: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    const res = await apiClient.post(`/service-requests/my-requests/${id}/verify-payment`, paymentData);
    return res.data.data;
  },
  async setCashPayment(id: string) {
    const res = await apiClient.post(`/service-requests/my-requests/${id}/cash-payment`);
    return res.data.data;
  },
};

export const contactService = {
  async submit(data: ContactFormData) {
    const res = await apiClient.post('/contact', data);
    return res.data;
  },
};
