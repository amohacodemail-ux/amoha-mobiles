import apiClient from '@/lib/api-client';

export interface PurchaseStats {
  totalPurchases: number;
  totalReceived: number;
  totalReturns: number;
  totalPaid: number;
  outstandingBalance: number;
}

export const purchaseService = {
  // GRN
  async createGRN(data: any) {
    const response = await apiClient.post('/purchase/grn', data);
    return response.data.data;
  },
  
  async getGRNs(params?: any) {
    const response = await apiClient.get('/purchase/grn', { params });
    return response.data.data;
  },

  // Returns
  async createReturn(data: any) {
    const response = await apiClient.post('/purchase/returns', data);
    return response.data.data;
  },

  async getReturns(params?: any) {
    const response = await apiClient.get('/purchase/returns', { params });
    return response.data.data;
  },

  // Payments
  async createPayment(data: any) {
    const response = await apiClient.post('/purchase/payments', data);
    return response.data.data;
  },

  async getPayments(params?: any) {
    const response = await apiClient.get('/purchase/payments', { params });
    return response.data.data;
  },

  // Reports
  async getReports(params?: any) {
    const response = await apiClient.get('/purchase/reports', { params });
    return response.data.data;
  }
};

