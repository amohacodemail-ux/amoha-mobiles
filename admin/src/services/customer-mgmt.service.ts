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

export const customerMgmtService = {
  // Customers
  getAll: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/customer-management?${buildQuery(filters)}`);
    return data.data;
  },

  getDetail: async (id: string) => {
    const { data } = await apiClient.get(`/customer-management/${id}`);
    return data.data;
  },

  getBehaviorAnalytics: async (id: string) => {
    const { data } = await apiClient.get(`/customer-management/${id}/behavior`);
    return data.data;
  },

  // Segmentation
  updateSegment: async (userId: string, segment: string) => {
    const { data } = await apiClient.put(`/customer-management/${userId}/segment`, { segment });
    return data.data;
  },

  autoSegment: async () => {
    const { data } = await apiClient.post('/customer-management/auto-segment');
    return data.data;
  },

  // Tags
  addTag: async (userId: string, tag: string) => {
    const { data } = await apiClient.post(`/customer-management/${userId}/tags`, { tag });
    return data.data;
  },

  removeTag: async (userId: string, tagId: string) => {
    await apiClient.delete(`/customer-management/${userId}/tags/${tagId}`);
  },

  // Notes
  addNote: async (userId: string, noteData: any) => {
    const { data } = await apiClient.post(`/customer-management/${userId}/notes`, noteData);
    return data.data;
  },

  updateNote: async (noteId: string, updates: any) => {
    const { data } = await apiClient.put(`/customer-management/notes/${noteId}`, updates);
    return data.data;
  },

  deleteNote: async (noteId: string) => {
    await apiClient.delete(`/customer-management/notes/${noteId}`);
  },

  // Fraud
  getFraudFlags: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/customer-management/fraud-flags?${buildQuery(filters)}`);
    return data.data;
  },

  createFraudFlag: async (payload: any) => {
    const { data } = await apiClient.post('/customer-management/fraud-flags', payload);
    return data.data;
  },

  resolveFraudFlag: async (flagId: string, resolutionNote: string) => {
    const { data } = await apiClient.post(`/customer-management/fraud-flags/${flagId}/resolve`, { resolutionNote });
    return data.data;
  },

  runFraudDetection: async () => {
    const { data } = await apiClient.post('/customer-management/fraud-detection/run');
    return data.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const { data } = await apiClient.get('/customer-management/dashboard');
    return data.data;
  },
};
