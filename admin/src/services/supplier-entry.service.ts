import apiClient from '@/lib/api-client';

const buildQuery = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
};

export const supplierEntryService = {
  // Admin endpoints
  getDashboardStats: async () => {
    const { data } = await apiClient.get('/supplier-entries/dashboard');
    return data.data;
  },
  getAllEntries: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/supplier-entries/all?${buildQuery(filters)}`);
    return data.data;
  },
  getEntryById: async (id: string) => {
    const { data } = await apiClient.get(`/supplier-entries/${id}`);
    return data.data;
  },
  convertEntry: async (id: string, productData: any) => {
    const { data } = await apiClient.post(`/supplier-entries/${id}/convert`, productData);
    return data.data;
  },
  rejectEntry: async (id: string, reason: string) => {
    const { data } = await apiClient.post(`/supplier-entries/${id}/reject`, { reason });
    return data.data;
  },
  // Supplier endpoints (also usable by admin)
  createEntry: async (payload: { itemName: string; quantity: number; price?: number; note?: string }) => {
    const { data } = await apiClient.post('/supplier-entries', payload);
    return data.data;
  },
  getMyEntries: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/supplier-entries/my?${buildQuery(filters)}`);
    return data.data;
  },
};
