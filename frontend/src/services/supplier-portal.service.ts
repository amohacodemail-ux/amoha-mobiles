import apiClient from '@/lib/api-client';

const buildQuery = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

export const supplierPortalService = {
  getMyProfile: async () => {
    const { data } = await apiClient.get('/suppliers/me');
    return data.data;
  },

  updateMyProfile: async (payload: Record<string, any>) => {
    const { data } = await apiClient.put('/suppliers/me', payload);
    return data.data;
  },

  createEntry: async (payload: { itemName: string; quantity: number; price?: number; note?: string }) => {
    const { data } = await apiClient.post('/supplier-entries', payload);
    return data.data;
  },

  getMyEntries: async (filters: Record<string, any> = {}) => {
    const query = buildQuery(filters);
    const { data } = await apiClient.get(`/supplier-entries/my${query ? `?${query}` : ''}`);
    return data.data;
  },
};
