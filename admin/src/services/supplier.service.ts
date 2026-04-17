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

export const supplierService = {
  // Suppliers CRUD
  getAll: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/suppliers?${buildQuery(filters)}`);
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data.data;
  },

  create: async (payload: any) => {
    const { data } = await apiClient.post('/suppliers', payload);
    return data.data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await apiClient.put(`/suppliers/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/suppliers/${id}`);
  },

  // Supplier Products
  getProducts: async (supplierId: string) => {
    const { data } = await apiClient.get(`/suppliers/${supplierId}/products`);
    return data.data;
  },

  assignProduct: async (supplierId: string, payload: any) => {
    const { data } = await apiClient.post(`/suppliers/${supplierId}/products`, payload);
    return data.data;
  },

  removeProduct: async (supplierId: string, productId: string) => {
    await apiClient.delete(`/suppliers/${supplierId}/products/${productId}`);
  },

  // Purchase Orders
  getAllPurchaseOrders: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/suppliers/purchase-orders?${buildQuery(filters)}`);
    return data.data;
  },

  getPurchaseOrderById: async (id: string) => {
    const { data } = await apiClient.get(`/suppliers/purchase-orders/${id}`);
    return data.data;
  },

  createPurchaseOrder: async (payload: any) => {
    const { data } = await apiClient.post('/suppliers/purchase-orders', payload);
    return data.data;
  },

  updatePurchaseOrder: async (id: string, payload: any) => {
    const { data } = await apiClient.put(`/suppliers/purchase-orders/${id}`, payload);
    return data.data;
  },

  receivePurchaseOrder: async (id: string, items: any[]) => {
    const { data } = await apiClient.post(`/suppliers/purchase-orders/${id}/receive`, { items });
    return data.data;
  },

  // Analytics
  getAnalytics: async () => {
    const { data } = await apiClient.get('/suppliers/analytics');
    return data.data;
  },

  getDashboardStats: async () => {
    const { data } = await apiClient.get('/suppliers/dashboard');
    return data.data;
  },
};
